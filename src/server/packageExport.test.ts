import { describe, expect, it } from "vitest";

const PACKAGE_SERVER_ENTRY = "@canop/auth-portals/server";

describe("@canop/auth-portals/server package export", () => {
  it("Given the built package, When its server entry is imported by name, Then it exposes the portal server API", async () => {
    const entry = (await import(PACKAGE_SERVER_ENTRY)) as typeof import("./index.js");

    expect(typeof entry.createPortalServer).toBe("function");
    expect(typeof entry.startPortalServer).toBe("function");
    expect(entry.LOOPBACK_HOST).toBe("127.0.0.1");
  }, 30_000);
});
