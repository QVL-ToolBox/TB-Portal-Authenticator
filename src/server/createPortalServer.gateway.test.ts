import {
  createServer,
  request,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GATEWAY_TIMEOUT_MS } from "./createGatewayForwarder.js";
import { createPortalServer, LOOPBACK_HOST, startPortalServer } from "./index.js";
import { GATEWAY_API_PREFIX, isGatewayApiPath } from "./isGatewayApiPath.js";

type GatewayRoute = (req: IncomingMessage, res: ServerResponse) => void;

const SECURITY_HEADERS = [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "strict-transport-security",
  "referrer-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
];

const listen = (server: Server, host = "127.0.0.1"): Promise<string> =>
  new Promise((resolve) => {
    server.listen(0, host, () => {
      const { port } = server.address() as AddressInfo;
      resolve(host.includes(":") ? `http://[${host}]:${port}` : `http://${host}:${port}`);
    });
  });

const close = (server: Server): Promise<void> =>
  new Promise((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  });

const securityHeadersOf = (headers: Headers): string[] =>
  SECURITY_HEADERS.filter((name) => headers.has(name));

const makeDistDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "auth-portals-gateway-"));
  writeFileSync(join(dir, "index.html"), "<html>index</html>");
  return dir;
};

const rawGet = (
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string }> =>
  new Promise((resolve, reject) => {
    const clientRequest = request(url, { headers }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () =>
        resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString() }),
      );
    });
    clientRequest.on("error", reject);
    clientRequest.end();
  });

describe("createPortalServer gateway forwarding details", () => {
  const routes = new Map<string, GatewayRoute>();
  const seen: { url: string; headers: IncomingHttpHeaders }[] = [];
  const gateway = createServer((req, res) => {
    seen.push({ url: req.url ?? "", headers: req.headers });
    const route = routes.get(new URL(req.url ?? "/", "http://gateway").pathname);
    if (route) return route(req, res);
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(req.url));
  });

  let gatewayUrl = "";
  let distDir = "";
  let portal: Server;
  let portalUrl = "";

  beforeAll(async () => {
    gatewayUrl = await listen(gateway);
    distDir = makeDistDir();
    portal = createServer(createPortalServer({ service: "gw-svc", gatewayUrl, distDir }));
    portalUrl = await listen(portal);
  });

  afterAll(async () => {
    await close(portal);
    await close(gateway);
    rmSync(distDir, { recursive: true, force: true });
  });

  afterEach(() => {
    seen.length = 0;
    routes.clear();
  });

  it("Given a query with encoded characters, When it is proxied, Then the gateway receives the query unchanged", async () => {
    const query = "?q=a%20b%2Bc&redirect=http%3A%2F%2Fexample.test%2Fx%3Fy%3D1&emoji=%C3%A9";

    const response = await fetch(`${portalUrl}/api/search${query}`);

    expect(response.status).toBe(200);
    expect(seen[0].url).toBe(`/api/search${query}`);
  });

  it("Given a header listed in Connection, When the request is proxied, Then the gateway does not receive it", async () => {
    const response = await rawGet(`${portalUrl}/api/auth/me`, {
      connection: "x-foo, X-Bar",
      "x-foo": "1",
      "x-bar": "2",
      "x-kept": "3",
    });

    expect(response.status).toBe(200);
    expect(seen[0].headers["x-foo"]).toBeUndefined();
    expect(seen[0].headers["x-bar"]).toBeUndefined();
    expect(seen[0].headers["x-kept"]).toBe("3");
  });

  it("Given hop-by-hop headers in the gateway response, When it is relayed, Then the client does not receive them", async () => {
    routes.set("/api/hop", (_req, res) => {
      res.writeHead(200, { connection: "x-internal", "x-internal": "secret", "x-public": "ok" });
      res.end("done");
    });

    const response = await fetch(`${portalUrl}/api/hop`);

    expect(response.headers.get("x-internal")).toBeNull();
    expect(response.headers.get("x-public")).toBe("ok");
  });

  it("Given a request already carrying X-Forwarded headers, When it is proxied, Then the chain is extended and the original host and proto are kept", async () => {
    await fetch(`${portalUrl}/api/auth/me`, {
      headers: {
        "x-forwarded-for": "203.0.113.7",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "portal.example.test",
      },
    });

    expect(seen[0].headers["x-forwarded-for"]).toMatch(/^203\.0\.113\.7, .*127\.0\.0\.1$/);
    expect(seen[0].headers["x-forwarded-proto"]).toBe("https");
    expect(seen[0].headers["x-forwarded-host"]).toBe("portal.example.test");
  });

  it("Given exactly /api, When it is requested, Then it is proxied to the gateway", async () => {
    await fetch(`${portalUrl}/api`);

    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe("/api");
  });
});

describe("createPortalServer gateway URL variants", () => {
  let distDir = "";

  beforeAll(() => {
    distDir = makeDistDir();
  });

  afterAll(() => {
    rmSync(distDir, { recursive: true, force: true });
  });

  it("Given a gateway URL with a base path, When /api is proxied, Then the base path prefixes the forwarded path", async () => {
    const urls: string[] = [];
    const gateway = createServer((req, res) => {
      urls.push(req.url ?? "");
      res.writeHead(200).end();
    });
    const gatewayUrl = await listen(gateway);
    const portal = createServer(
      createPortalServer({ service: "svc", gatewayUrl: `${gatewayUrl}/edge/`, distDir }),
    );
    const portalUrl = await listen(portal);

    try {
      await fetch(`${portalUrl}/api/auth/me?x=1`);

      expect(urls).toEqual(["/edge/api/auth/me?x=1"]);
    } finally {
      await close(portal);
      await close(gateway);
    }
  });

  it("Given an IPv6 gateway URL, When /api is proxied, Then the gateway receives the request", async () => {
    const urls: string[] = [];
    const gateway = createServer((req, res) => {
      urls.push(req.url ?? "");
      res.writeHead(200).end();
    });
    const gatewayUrl = await listen(gateway, "::1");
    const portal = createServer(createPortalServer({ service: "svc", gatewayUrl, distDir }));
    const portalUrl = await listen(portal);

    try {
      const response = await fetch(`${portalUrl}/api/ping`);

      expect(response.status).toBe(200);
      expect(urls).toEqual(["/api/ping"]);
    } finally {
      await close(portal);
      await close(gateway);
    }
  });

  it("Given an unreachable https gateway, When /api is proxied, Then the portal answers 502 without security headers", async () => {
    const closed = createServer();
    const closedUrl = await listen(closed);
    await close(closed);
    const portal = createServer(
      createPortalServer({
        service: "svc",
        gatewayUrl: closedUrl.replace("http:", "https:"),
        distDir,
      }),
    );
    const portalUrl = await listen(portal);

    try {
      const response = await fetch(`${portalUrl}/api/auth/me`);

      expect(response.status).toBe(502);
      expect(securityHeadersOf(response.headers)).toEqual([]);
    } finally {
      await close(portal);
    }
  });
});

describe("createPortalServer gateway timeout", () => {
  it("Given no gatewayTimeoutMs, Then the default gateway delay is 30 seconds", () => {
    expect(GATEWAY_TIMEOUT_MS).toBe(30_000);
  });

  it("Given a gateway that never answers, When gatewayTimeoutMs elapses, Then the portal answers 504 without security headers", async () => {
    const gateway = createServer(() => undefined);
    const gatewayUrl = await listen(gateway);
    const distDir = makeDistDir();
    const portal = createServer(
      createPortalServer({ service: "svc", gatewayUrl, distDir, gatewayTimeoutMs: 100 }),
    );
    const portalUrl = await listen(portal);

    try {
      const startedAt = Date.now();
      const response = await fetch(`${portalUrl}/api/mute`);

      expect(response.status).toBe(504);
      expect(Date.now() - startedAt).toBeLessThan(5_000);
      expect(securityHeadersOf(response.headers)).toEqual([]);
      expect(await response.text()).not.toMatch(/127\.0\.0\.1|at .*\.js/);
      const health = await fetch(`${portalUrl}/health`);
      expect(health.status).toBe(200);
    } finally {
      await close(portal);
      await close(gateway);
      rmSync(distDir, { recursive: true, force: true });
    }
  });

  it.each([0, -1, 1.5, Number.NaN])(
    "Given gatewayTimeoutMs %s, When the portal server is created, Then it throws a RangeError",
    (gatewayTimeoutMs) => {
      expect(() =>
        createPortalServer({
          service: "svc",
          gatewayUrl: "http://127.0.0.1:9",
          distDir: tmpdir(),
          gatewayTimeoutMs,
        }),
      ).toThrow(RangeError);
    },
  );
});

describe("startPortalServer", () => {
  it("Given options without host, When it starts, Then it listens on the loopback host and logs one JSON line", async () => {
    const distDir = makeDistDir();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const server = startPortalServer({
      service: "start-svc",
      port: 0,
      gatewayUrl: "http://127.0.0.1:9",
      distDir,
    });

    try {
      await new Promise<void>((resolve) => server.once("listening", () => resolve()));
      const { address, port } = server.address() as AddressInfo;
      const response = await fetch(`http://${LOOPBACK_HOST}:${port}/health`);

      expect(address).toBe("127.0.0.1");
      expect(await response.json()).toEqual({ status: "ok", service: "start-svc" });
      await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(1));
      expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({
        level: "INFO",
        service: "start-svc",
        host: "127.0.0.1",
        port: 0,
        gateway_url: "http://127.0.0.1:9",
      });
    } finally {
      log.mockRestore();
      await close(server);
      rmSync(distDir, { recursive: true, force: true });
    }
  });
});

describe("isGatewayApiPath", () => {
  it.each(["/api", "/api/", "/api/auth/me"])("Given %s, Then it is a gateway path", (path) => {
    expect(isGatewayApiPath(path)).toBe(true);
  });

  it.each(["/", "/apix", "/api-docs", "/login/api"])(
    "Given %s, Then it is not a gateway path",
    (path) => {
      expect(isGatewayApiPath(path)).toBe(false);
    },
  );

  it("Given the prefix constant, Then it is /api", () => {
    expect(GATEWAY_API_PREFIX).toBe("/api");
  });
});
