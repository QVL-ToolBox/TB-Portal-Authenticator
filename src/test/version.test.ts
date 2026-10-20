import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";
import { AUTH_PORTALS_VERSION } from "../index";

const packageJson = JSON.parse(readFileSync(resolve(cwd(), "package.json"), "utf-8")) as {
  version: string;
};

describe("@canop/auth-portals", () => {
  it("expose la version de la librairie alignee sur package.json", () => {
    expect(AUTH_PORTALS_VERSION).toBe(packageJson.version);
  });
});
