import { createServer, type Server } from "node:http";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createPortalServer,
  DEFAULT_SECURITY_HEADERS,
  startPortalServer,
  type SecurityHeadersOption,
} from "./index.js";

const EXPECTED_DEFAULTS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "geolocation=(), microphone=(), camera=()",
  "content-security-policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
};

const DEFAULT_NAMES = Object.keys(EXPECTED_DEFAULTS);

const UNREACHABLE_GATEWAY = "http://127.0.0.1:9";

const HEADER_INJECTION = `DENY${String.fromCharCode(13, 10)}Set-Cookie: a=b`;

type Portal = { server: Server; url: string };

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

const makeDistDir = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "auth-portals-security-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "assets", "app.js"), "console.log('asset');");
  writeFileSync(join(dir, "index.html"), "<html>spa-index</html>");
  return dir;
};

const securityHeadersOf = (response: Response): Record<string, string> =>
  Object.fromEntries(
    DEFAULT_NAMES.flatMap((name) => {
      const value = response.headers.get(name);
      return value === null ? [] : [[name, value]];
    }),
  );

const startQuietly = async (
  gatewayUrl: string,
  distDir: string,
  securityHeaders?: SecurityHeadersOption,
): Promise<Portal> => {
  const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const options = { service: "security-svc", port: 0, gatewayUrl, distDir };
  const server = startPortalServer(
    securityHeaders === undefined ? options : { ...options, securityHeaders },
  );
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  log.mockRestore();
  const { port } = server.address() as AddressInfo;
  return { server, url: `http://127.0.0.1:${port}` };
};

const createListening = async (
  gatewayUrl: string,
  distDir: string,
  securityHeaders?: SecurityHeadersOption,
): Promise<Portal> => {
  const options = { service: "security-svc", gatewayUrl, distDir };
  const server = createServer(
    createPortalServer(securityHeaders === undefined ? options : { ...options, securityHeaders }),
  );
  return { server, url: await listen(server) };
};

describe("securityHeaders - en-tetes de securite des portails", () => {
  const gateway = createServer((req, res) => {
    if (req.url?.startsWith("/api/framed")) {
      res.writeHead(200, { "content-type": "application/json", "x-frame-options": "SAMEORIGIN" });
    } else {
      res.writeHead(200, { "content-type": "application/json" });
    }
    res.end(JSON.stringify({ gateway: true }));
  });

  let gatewayUrl = "";
  let distDir = "";
  const portals: Portal[] = [];

  const track = async (portal: Promise<Portal>): Promise<string> => {
    const started = await portal;
    portals.push(started);
    return started.url;
  };

  beforeAll(async () => {
    gatewayUrl = await listen(gateway);
    distDir = makeDistDir();
  });

  afterAll(async () => {
    await Promise.all(portals.map((portal) => close(portal.server)));
    await close(gateway);
    rmSync(distDir, { recursive: true, force: true });
  });

  it("Given the package, When DEFAULT_SECURITY_HEADERS is read, Then it holds the documented default set", () => {
    const normalized = Object.fromEntries(
      Object.entries(DEFAULT_SECURITY_HEADERS).map(([name, value]) => [name.toLowerCase(), value]),
    );

    expect(normalized).toEqual(EXPECTED_DEFAULTS);
  });

  describe("startPortalServer sans option securityHeaders", () => {
    let url = "";

    beforeAll(async () => {
      url = await track(startQuietly(gatewayUrl, distDir));
    });

    it.each([
      ["la sante", "/health", 200],
      ["un fichier statique", "/assets/app.js", 200],
      ["le repli SPA", "/une/route/front", 200],
      ["une route /api proxifiee", "/api/auth/me", 200],
    ])(
      "Given the default, When %s is requested, Then every default header is set",
      async (_, path, status) => {
        const response = await fetch(`${url}${path}`);

        expect(response.status).toBe(status);
        expect(securityHeadersOf(response)).toEqual(EXPECTED_DEFAULTS);
      },
    );

    it("Given the default, When a static file is requested with an unsatisfiable range, Then the error response carries the default headers", async () => {
      const response = await fetch(`${url}/assets/app.js`, {
        headers: { range: "bytes=999999-1000000" },
      });

      expect(response.status).toBe(416);
      expect(securityHeadersOf(response)).toEqual(EXPECTED_DEFAULTS);
    });

    it("Given the default, When the gateway sets one of the headers itself, Then the gateway value is kept", async () => {
      const response = await fetch(`${url}/api/framed`);

      expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    });
  });

  it("Given startPortalServer with an unreachable gateway, When /api is requested, Then the 502 carries the default headers", async () => {
    const url = await track(startQuietly(UNREACHABLE_GATEWAY, distDir));

    const response = await fetch(`${url}/api/auth/me`);

    expect(response.status).toBe(502);
    expect(securityHeadersOf(response)).toEqual(EXPECTED_DEFAULTS);
  });

  it("Given startPortalServer with securityHeaders true, When /health is requested, Then the default headers are set", async () => {
    const url = await track(startQuietly(gatewayUrl, distDir, true));

    const response = await fetch(`${url}/health`);

    expect(securityHeadersOf(response)).toEqual(EXPECTED_DEFAULTS);
  });

  describe.each([
    ["startPortalServer", startQuietly],
    ["createPortalServer", createListening],
  ])("%s avec securityHeaders false", (_, start) => {
    it.each(["/health", "/assets/app.js", "/une/route/front", "/api/auth/me"])(
      "Given false, When %s is requested, Then no security header is set",
      async (path) => {
        const url = await track(start(gatewayUrl, distDir, false));

        const response = await fetch(`${url}${path}`);

        expect(response.status).toBe(200);
        expect(securityHeadersOf(response)).toEqual({});
      },
    );
  });

  describe.each([
    ["startPortalServer", startQuietly],
    ["createPortalServer", createListening],
  ])("%s avec un objet de surcharge", (_, start) => {
    const overrides = {
      "content-security-policy": "frame-ancestors 'self'",
      "X-Frame-Options": false,
    } as const;

    it.each(["/health", "/une/route/front", "/api/auth/me"])(
      "Given an override and a removal, When %s is requested, Then the override applies, the removed header is absent and the others keep their default",
      async (path) => {
        const url = await track(start(gatewayUrl, distDir, overrides));

        const response = await fetch(`${url}${path}`);

        expect(securityHeadersOf(response)).toEqual({
          "x-content-type-options": "nosniff",
          "referrer-policy": "strict-origin-when-cross-origin",
          "permissions-policy": "geolocation=(), microphone=(), camera=()",
          "content-security-policy": "frame-ancestors 'self'",
        });
      },
    );

    it("Given an override with a name in another case, When /health is requested, Then the header is overridden once", async () => {
      const url = await track(start(gatewayUrl, distDir, { "REFERRER-POLICY": "no-referrer" }));

      const response = await fetch(`${url}/health`);

      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(securityHeadersOf(response)).toEqual({
        ...EXPECTED_DEFAULTS,
        "referrer-policy": "no-referrer",
      });
    });

    it("Given an empty override object, When /health is requested, Then the default headers are set", async () => {
      const url = await track(start(gatewayUrl, distDir, {}));

      const response = await fetch(`${url}/health`);

      expect(securityHeadersOf(response)).toEqual(EXPECTED_DEFAULTS);
    });
  });

  it("Given createPortalServer with securityHeaders true, When /health is requested, Then the default headers are set", async () => {
    const url = await track(createListening(gatewayUrl, distDir, true));

    const response = await fetch(`${url}/health`);

    expect(securityHeadersOf(response)).toEqual(EXPECTED_DEFAULTS);
  });

  it("Given createPortalServer without securityHeaders, When /health is requested, Then no security header is set", async () => {
    const url = await track(createListening(gatewayUrl, distDir));

    const response = await fetch(`${url}/health`);

    expect(securityHeadersOf(response)).toEqual({});
  });

  describe("valeur invalide", () => {
    const invalidOptions: [string, unknown, ErrorConstructor][] = [
      ["un nom d'en-tete avec espace", { "Bad Name": "x" }, TypeError],
      ["un nom d'en-tete vide", { "": "x" }, TypeError],
      ["une valeur avec saut de ligne", { "X-Frame-Options": HEADER_INJECTION }, TypeError],
      ["une valeur non chaine", { "X-Frame-Options": 42 }, TypeError],
      ["une valeur true", { "X-Frame-Options": true }, TypeError],
      ["une option chaine", "yes", Error],
      ["une option nombre", 1, Error],
    ];

    it.each(invalidOptions)(
      "Given %s, When createPortalServer is called, Then it throws",
      (_, securityHeaders, expected) => {
        expect(() =>
          createPortalServer({
            service: "svc",
            gatewayUrl,
            distDir,
            securityHeaders: securityHeaders as SecurityHeadersOption,
          }),
        ).toThrow(expected);
      },
    );

    it.each(invalidOptions)(
      "Given %s, When startPortalServer is called, Then it throws at startup",
      (_, securityHeaders, expected) => {
        const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
        let started: Server | undefined;
        const start = () => {
          started = startPortalServer({
            service: "svc",
            port: 0,
            gatewayUrl,
            distDir,
            securityHeaders: securityHeaders as SecurityHeadersOption,
          });
        };

        try {
          expect(start).toThrow(expected);
        } finally {
          started?.close();
          log.mockRestore();
        }
      },
    );
  });
});
