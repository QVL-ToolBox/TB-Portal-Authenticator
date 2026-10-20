import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createPortalServer } from "./index.js";

type GatewayHit = {
  method: string;
  url: string;
  headers: IncomingHttpHeaders;
  body: string;
};

const SERVICE = "generic-auth-portal";
const INDEX_HTML = '<!doctype html><html><body><div id="root"></div>portal-index</body></html>';
const APP_JS = "console.log('portal-asset');";

const SECURITY_HEADERS = [
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-type-options",
  "x-frame-options",
  "strict-transport-security",
  "referrer-policy",
  "x-xss-protection",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "cross-origin-embedder-policy",
  "origin-agent-cluster",
  "x-dns-prefetch-control",
  "x-download-options",
  "x-permitted-cross-domain-policies",
];

const listen = (server: Server): Promise<string> =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });

const close = (server: Server): Promise<void> =>
  new Promise((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  });

const securityHeadersOf = (response: Response): string[] =>
  SECURITY_HEADERS.filter((name) => response.headers.has(name));

const makeDistDir = (withIndex: boolean): string => {
  const dir = mkdtempSync(join(tmpdir(), "auth-portals-dist-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "assets", "app.js"), APP_JS);
  if (withIndex) writeFileSync(join(dir, "index.html"), INDEX_HTML);
  return dir;
};

const startPortal = async (gatewayUrl: string, distDir: string) => {
  const server = createServer(createPortalServer({ service: SERVICE, gatewayUrl, distDir }));
  return { server, url: await listen(server) };
};

describe("createPortalServer", () => {
  const hits: GatewayHit[] = [];
  const gateway = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      hits.push({
        method: req.method ?? "",
        url: req.url ?? "",
        headers: req.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      });
      const status = req.url?.startsWith("/api/auth/unauthorized") ? 401 : 200;
      res.writeHead(status, { "content-type": "application/json", "x-from-gateway": "yes" });
      res.end(JSON.stringify({ gateway: true, url: req.url }));
    });
  });

  let gatewayUrl = "";
  let distDir = "";
  let portal: { server: Server; url: string };

  beforeAll(async () => {
    gatewayUrl = await listen(gateway);
    distDir = makeDistDir(true);
    portal = await startPortal(gatewayUrl, distDir);
  });

  afterAll(async () => {
    await close(portal.server);
    await close(gateway);
    rmSync(distDir, { recursive: true, force: true });
  });

  afterEach(() => {
    hits.length = 0;
  });

  describe("health", () => {
    it("Given a portal, When GET /health, Then it answers 200 with status ok and the service name", async () => {
      const response = await fetch(`${portal.url}/health`);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual({ status: "ok", service: SERVICE });
      expect(hits).toHaveLength(0);
    });

    it("Given a portal, When GET /health, Then no security header is set", async () => {
      const response = await fetch(`${portal.url}/health`);

      expect(securityHeadersOf(response)).toEqual([]);
    });
  });

  describe("gateway proxy", () => {
    it("Given a GET under /api, When it reaches the portal, Then the gateway receives the same method, path and query", async () => {
      const response = await fetch(`${portal.url}/api/auth/me?lang=fr&x=1`);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-from-gateway")).toBe("yes");
      expect(await response.json()).toEqual({ gateway: true, url: "/api/auth/me?lang=fr&x=1" });
      expect(hits).toHaveLength(1);
      expect(hits[0].method).toBe("GET");
      expect(hits[0].url).toBe("/api/auth/me?lang=fr&x=1");
    });

    it("Given a POST with a JSON body under /api, When it reaches the portal, Then the gateway receives the body and content type untouched", async () => {
      const payload = JSON.stringify({ email: "jane@qvl.fr", password: "S3cret!é" });

      const response = await fetch(`${portal.url}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer token-123" },
        body: payload,
      });

      expect(response.status).toBe(200);
      expect(hits).toHaveLength(1);
      expect(hits[0].method).toBe("POST");
      expect(hits[0].url).toBe("/api/auth/login");
      expect(hits[0].body).toBe(payload);
      expect(hits[0].headers["content-type"]).toBe("application/json");
      expect(hits[0].headers.authorization).toBe("Bearer token-123");
    });

    it.each(["PUT", "PATCH", "DELETE"])(
      "Given a %s under /api, When it reaches the portal, Then the gateway receives the same method",
      async (method) => {
        const response = await fetch(`${portal.url}/api/auth/account`, { method, body: "{}" });

        expect(response.status).toBe(200);
        expect(hits).toHaveLength(1);
        expect(hits[0].method).toBe(method);
        expect(hits[0].url).toBe("/api/auth/account");
        expect(hits[0].body).toBe("{}");
      },
    );

    it("Given a proxied request, When it reaches the gateway, Then X-Forwarded-For, X-Forwarded-Proto and X-Forwarded-Host are set", async () => {
      const portalHost = new URL(portal.url).host;

      await fetch(`${portal.url}/api/auth/me`);

      expect(hits).toHaveLength(1);
      expect(hits[0].headers["x-forwarded-for"]).toContain("127.0.0.1");
      expect(hits[0].headers["x-forwarded-proto"]).toBe("http");
      expect(hits[0].headers["x-forwarded-host"]).toBe(portalHost);
    });

    it("Given a proxied request, When it reaches the gateway, Then the Host header targets the gateway", async () => {
      await fetch(`${portal.url}/api/auth/me`);

      expect(hits[0].headers.host).toBe(new URL(gatewayUrl).host);
    });

    it("Given the gateway answers 401, When the portal relays it, Then the client receives the gateway status and body", async () => {
      const response = await fetch(`${portal.url}/api/auth/unauthorized`);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ gateway: true, url: "/api/auth/unauthorized" });
    });

    it("Given a proxied response, When it reaches the client, Then no security header is set", async () => {
      const response = await fetch(`${portal.url}/api/auth/me`);

      expect(securityHeadersOf(response)).toEqual([]);
    });

    it.each(["/apix", "/apix/auth/me", "/api-docs", "/apis"])(
      "Given the path %s that only starts like /api, When it reaches the portal, Then it is not proxied",
      async (path) => {
        const response = await fetch(`${portal.url}${path}`);

        expect(hits).toHaveLength(0);
        expect(await response.text()).not.toContain("gateway");
        expect(securityHeadersOf(response)).toEqual([]);
      },
    );
  });

  describe("static files and SPA fallback", () => {
    it("Given a built asset, When it is requested, Then the file content is served", async () => {
      const response = await fetch(`${portal.url}/assets/app.js`);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(APP_JS);
      expect(securityHeadersOf(response)).toEqual([]);
    });

    it("Given the root path, When it is requested, Then index.html is served", async () => {
      const response = await fetch(`${portal.url}/`);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe(INDEX_HTML);
      expect(securityHeadersOf(response)).toEqual([]);
    });

    it.each(["/login", "/account", "/cgu", "/reset-password?token=abc", "/deep/client/route"])(
      "Given the client route %s, When it is requested, Then index.html is served without security headers",
      async (path) => {
        const response = await fetch(`${portal.url}${path}`);

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("text/html");
        expect(await response.text()).toBe(INDEX_HTML);
        expect(securityHeadersOf(response)).toEqual([]);
        expect(hits).toHaveLength(0);
      },
    );

    it("Given a missing asset, When it is requested, Then no security header is set", async () => {
      const response = await fetch(`${portal.url}/assets/missing.js`);

      expect(securityHeadersOf(response)).toEqual([]);
    });

    it.each(["/assets/app.js", "/index.html", "/login"])(
      "Given an unsatisfiable Range on %s, When it is requested, Then the error response has no security header",
      async (path) => {
        const response = await fetch(`${portal.url}${path}`, {
          headers: { range: "bytes=99999-100000" },
        });

        expect(response.status).toBe(416);
        expect(securityHeadersOf(response)).toEqual([]);
      },
    );

    it("Given a non GET request outside /api, When it reaches the portal, Then no security header is set", async () => {
      const response = await fetch(`${portal.url}/login`, { method: "POST", body: "x" });

      expect(hits).toHaveLength(0);
      expect(securityHeadersOf(response)).toEqual([]);
    });
  });
});

describe("createPortalServer error cases", () => {
  it("Given a distDir without index.html, When a client route is requested, Then the error response has no security header", async () => {
    const distDir = makeDistDir(false);
    const portal = await startPortal("http://127.0.0.1:9", distDir);

    try {
      const response = await fetch(`${portal.url}/login`);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(securityHeadersOf(response)).toEqual([]);
    } finally {
      await close(portal.server);
      rmSync(distDir, { recursive: true, force: true });
    }
  });

  it("Given an unreachable gateway, When an /api request is proxied, Then the portal answers an error without security headers", async () => {
    const unreachable = createServer();
    const unreachableUrl = await listen(unreachable);
    await close(unreachable);
    const distDir = makeDistDir(true);
    const portal = await startPortal(unreachableUrl, distDir);

    try {
      const response = await fetch(`${portal.url}/api/auth/me`);

      expect(response.status).toBeGreaterThanOrEqual(500);
      expect(securityHeadersOf(response)).toEqual([]);
    } finally {
      await close(portal.server);
      rmSync(distDir, { recursive: true, force: true });
    }
  });
});
