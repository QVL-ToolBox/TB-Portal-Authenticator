import { describe, expect, it } from "vitest";
import { safeRedirect } from "../index";
import {
  FALLBACK,
  POLICY,
  REJECTED_TARGETS,
  SAFE_BUT_UNSPECIFIED_TARGETS,
  SAFE_ORIGINS,
  TRUSTED_ORIGIN,
  landingOrigin,
} from "./support/redirectFixtures";

describe("safeRedirect - cibles refusees renvoient fallbackRedirect", () => {
  it.each(Object.entries(REJECTED_TARGETS))("%s", (_, target) => {
    expect(safeRedirect(target, POLICY)).toBe(FALLBACK);
  });
});

describe("safeRedirect - cibles absentes renvoient fallbackRedirect", () => {
  it.each([null, undefined, "", "   "])("cible %j", (target) => {
    expect(safeRedirect(target, POLICY)).toBe(FALLBACK);
  });
});

describe("safeRedirect - cas limites ne quittent jamais une origine sure", () => {
  it.each(Object.entries(SAFE_BUT_UNSPECIFIED_TARGETS))("%s", (_, target) => {
    expect(SAFE_ORIGINS).toContain(landingOrigin(safeRedirect(target, POLICY)));
  });

  it("une URL de confiance avec hote en majuscules reste sur l'origine de confiance", () => {
    expect(landingOrigin(safeRedirect("https://APP.EXAMPLE.TEST/x", POLICY))).toBe(TRUSTED_ORIGIN);
  });

  it("une tres longue chaine encodee est traitee en moins d'une seconde", () => {
    const start = performance.now();
    safeRedirect(`/${"%2525".repeat(50_000)}`, POLICY);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

describe("safeRedirect - cibles valides conservees", () => {
  it.each([
    ["chemin relatif simple", "/dashboard"],
    ["chemin relatif avec query et ancre", "/dashboard?tab=1#top"],
    ["racine", "/"],
    ["chemin relatif encode propre", "/a%20b"],
    ["URL absolue d'une origine de confiance", "https://app.example.test/home?x=1"],
    ["URL absolue de la seconde origine de confiance", "http://localhost:5173/admin"],
  ])("%s", (_, target) => {
    expect(safeRedirect(target, POLICY)).toBe(target);
  });

  it("l'origine de confiance seule redirige vers cette origine", () => {
    expect(landingOrigin(safeRedirect(TRUSTED_ORIGIN, POLICY))).toBe(TRUSTED_ORIGIN);
  });
});

describe("safeRedirect - policy pilotee par la config", () => {
  it("renvoie le fallback configure", () => {
    expect(safeRedirect("//evil.test", { ...POLICY, fallbackRedirect: "/home" })).toBe("/home");
  });

  it("refuse toute URL absolue quand trustedOrigins est vide", () => {
    expect(
      safeRedirect("https://app.example.test/home", {
        trustedOrigins: [],
        fallbackRedirect: FALLBACK,
      }),
    ).toBe(FALLBACK);
  });
});
