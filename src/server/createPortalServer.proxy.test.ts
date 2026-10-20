import {
  createServer,
  request,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPortalServer } from "./index.js";

type GatewayRoute = (req: IncomingMessage, res: ServerResponse) => void;

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

const sha256 = (data: Buffer): string => createHash("sha256").update(data).digest("hex");

const readBody = (req: IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const waitFor = async (condition: () => boolean, timeoutMs: number): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return true;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return condition();
};

const securityHeadersOf = (headers: Headers): string[] =>
  SECURITY_HEADERS.filter((name) => headers.has(name));

describe("createPortalServer gateway proxy robustness", () => {
  const routes = new Map<string, GatewayRoute>();
  const gateway = createServer((req, res) => {
    const route = routes.get(new URL(req.url ?? "/", "http://gateway").pathname);
    if (route) return route(req, res);
    res.writeHead(404).end();
  });

  let distDir = "";
  let portal: Server;
  let portalUrl = "";

  beforeAll(async () => {
    const gatewayUrl = await listen(gateway);
    distDir = mkdtempSync(join(tmpdir(), "auth-portals-proxy-"));
    writeFileSync(join(distDir, "index.html"), "<html>index</html>");
    portal = createServer(createPortalServer({ service: "proxy-svc", gatewayUrl, distDir }));
    portalUrl = await listen(portal);
  });

  afterAll(async () => {
    await close(portal);
    await close(gateway);
    rmSync(distDir, { recursive: true, force: true });
  });

  it("Given a large chunked upload, When it is proxied, Then the gateway receives every byte unchanged", async () => {
    const payload = randomBytes(8 * 1024 * 1024);
    let received: { digest: string; length: number; transferEncoding?: string } | undefined;
    routes.set("/api/upload", async (req, res) => {
      const body = await readBody(req);
      received = {
        digest: sha256(body),
        length: body.length,
        transferEncoding: req.headers["transfer-encoding"],
      };
      res
        .writeHead(201, { "content-type": "application/json" })
        .end(JSON.stringify({ size: body.length }));
    });
    const chunkSize = 64 * 1024;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < payload.length; offset += chunkSize) {
          controller.enqueue(payload.subarray(offset, offset + chunkSize));
        }
        controller.close();
      },
    });

    const response = await fetch(`${portalUrl}/api/upload`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: stream,
      duplex: "half",
    } as RequestInit);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ size: payload.length });
    expect(received?.length).toBe(payload.length);
    expect(received?.digest).toBe(sha256(payload));
  });

  it("Given a large gateway response, When it is proxied, Then the client receives every byte unchanged", async () => {
    const payload = randomBytes(6 * 1024 * 1024);
    routes.set("/api/download", (_req, res) => {
      res.writeHead(200, { "content-type": "application/octet-stream" });
      res.end(payload);
    });

    const response = await fetch(`${portalUrl}/api/download`);
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(body.length).toBe(payload.length);
    expect(sha256(body)).toBe(sha256(payload));
  });

  it("Given the gateway sets several cookies, When the response is proxied, Then the client receives every Set-Cookie unchanged", async () => {
    const cookies = [
      "access_token=abc; Path=/; HttpOnly; Secure; SameSite=Strict",
      "refresh_token=def; Path=/api/auth/refresh; HttpOnly; Secure; SameSite=Strict; Max-Age=604800",
      "lang=fr; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT",
    ];
    routes.set("/api/auth/login", (_req, res) => {
      res.setHeader("set-cookie", cookies);
      res.writeHead(200, { "content-type": "application/json" }).end("{}");
    });

    const response = await fetch(`${portalUrl}/api/auth/login`, { method: "POST", body: "{}" });

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toEqual(cookies);
  });

  it("Given the client sends cookies, When the request is proxied, Then the gateway receives the Cookie header unchanged", async () => {
    let cookieHeader: string | undefined;
    routes.set("/api/auth/me", (req, res) => {
      cookieHeader = req.headers.cookie;
      res.writeHead(200).end();
    });

    await fetch(`${portalUrl}/api/auth/me`, { headers: { cookie: "access_token=abc; lang=fr" } });

    expect(cookieHeader).toBe("access_token=abc; lang=fr");
  });

  it("Given a slow gateway response, When the client disconnects midway, Then the gateway connection is released and the portal keeps serving", async () => {
    let gatewaySawClose = false;
    routes.set("/api/slow", (_req, res) => {
      res.on("close", () => {
        gatewaySawClose = true;
      });
      res.writeHead(200, { "content-type": "text/plain" });
      res.write("first-chunk");
    });

    await new Promise<void>((resolve, reject) => {
      const clientRequest = request(`${portalUrl}/api/slow`, (response) => {
        response.once("data", () => {
          clientRequest.destroy();
          resolve();
        });
      });
      clientRequest.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code !== "ECONNRESET") reject(error);
      });
      clientRequest.end();
    });

    expect(await waitFor(() => gatewaySawClose, 3000)).toBe(true);
    const health = await fetch(`${portalUrl}/health`);
    expect(health.status).toBe(200);
  });

  it("Given a slow gateway, When the client aborts before any response, Then the portal keeps serving", async () => {
    let gatewaySawClose = false;
    routes.set("/api/hang", (req) => {
      req.socket.on("close", () => {
        gatewaySawClose = true;
      });
    });

    await expect(
      fetch(`${portalUrl}/api/hang`, { signal: AbortSignal.timeout(200) }),
    ).rejects.toThrow();

    expect(await waitFor(() => gatewaySawClose, 3000)).toBe(true);
    const health = await fetch(`${portalUrl}/health`);
    expect(health.status).toBe(200);
  });
});

describe("createPortalServer with an unreachable gateway", () => {
  let portal: Server;
  let portalUrl = "";
  let distDir = "";

  beforeAll(async () => {
    const unreachable = createServer();
    const unreachableUrl = await listen(unreachable);
    await close(unreachable);
    distDir = mkdtempSync(join(tmpdir(), "auth-portals-down-"));
    writeFileSync(join(distDir, "index.html"), "<html>index</html>");
    portal = createServer(
      createPortalServer({ service: "proxy-svc", gatewayUrl: unreachableUrl, distDir }),
    );
    portalUrl = await listen(portal);
  });

  afterAll(async () => {
    await close(portal);
    rmSync(distDir, { recursive: true, force: true });
  });

  it.each(["GET", "POST", "DELETE"])(
    "Given an unreachable gateway, When a %s under /api is proxied, Then the portal answers 502 without security headers",
    async (method) => {
      const response = await fetch(`${portalUrl}/api/auth/me`, {
        method,
        body: method === "GET" ? undefined : "{}",
      });

      expect(response.status).toBe(502);
      expect(securityHeadersOf(response.headers)).toEqual([]);
      expect(await response.text()).not.toMatch(/ECONNREFUSED|127\.0\.0\.1|at .*\.js/);
    },
  );

  it("Given an unreachable gateway, When /health is requested, Then the portal still answers ok", async () => {
    const response = await fetch(`${portalUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "proxy-svc" });
  });
});
