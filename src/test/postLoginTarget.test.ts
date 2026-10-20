import { describe, expect, it } from "vitest";
import {
  getRedirectTarget,
  loginRedirectPath,
  readRedirectCookie,
  resolvePostLoginTarget,
  safeRedirect,
} from "../index";
import { FALLBACK, POLICY, REJECTED_TARGETS } from "./support/redirectFixtures";

const COOKIE = "acme_redirect";

function redirectParamOf(path: string): string | null {
  return new URL(path, "https://portal.example.test").searchParams.get("redirect");
}

function searchFor(target: string): string {
  return `?redirect=${encodeURIComponent(target)}`;
}

describe("getRedirectTarget", () => {
  it("lit le parametre redirect decode", () => {
    expect(getRedirectTarget({ search: searchFor("/dashboard?tab=1"), cookieTarget: null })).toBe(
      "/dashboard?tab=1",
    );
  });

  it("lit le cookie quand redirect=1", () => {
    expect(getRedirectTarget({ search: "?redirect=1", cookieTarget: "/from-cookie" })).toBe(
      "/from-cookie",
    );
  });

  it("ignore le cookie sans intention redirect=1", () => {
    expect(getRedirectTarget({ search: "", cookieTarget: "/from-cookie" })).toBeNull();
  });

  it("ne renvoie rien sans parametre ni cookie", () => {
    expect(getRedirectTarget({ search: "?other=x", cookieTarget: null })).toBeNull();
  });
});

describe("resolvePostLoginTarget", () => {
  it("chemin relatif propre en parametre", () => {
    expect(
      resolvePostLoginTarget({ search: searchFor("/dashboard"), cookieTarget: null }, POLICY),
    ).toBe("/dashboard");
  });

  it("URL absolue de confiance en parametre", () => {
    const target = "https://app.example.test/home";
    expect(resolvePostLoginTarget({ search: searchFor(target), cookieTarget: null }, POLICY)).toBe(
      target,
    );
  });

  it("redirect=1 avec cookie valide", () => {
    expect(
      resolvePostLoginTarget({ search: "?redirect=1", cookieTarget: "/from-cookie" }, POLICY),
    ).toBe("/from-cookie");
  });

  it("redirect=1 avec cookie absent", () => {
    expect(resolvePostLoginTarget({ search: "?redirect=1", cookieTarget: null }, POLICY)).toBe(
      FALLBACK,
    );
  });

  it("sans parametre", () => {
    expect(resolvePostLoginTarget({ search: "", cookieTarget: null }, POLICY)).toBe(FALLBACK);
  });

  it("parametre redirect brut non encode //evil.test", () => {
    expect(
      resolvePostLoginTarget({ search: "?redirect=//evil.test", cookieTarget: null }, POLICY),
    ).toBe(FALLBACK);
  });

  describe("cible malveillante en parametre", () => {
    it.each(Object.entries(REJECTED_TARGETS))("%s", (_, target) => {
      expect(
        resolvePostLoginTarget({ search: searchFor(target), cookieTarget: null }, POLICY),
      ).toBe(FALLBACK);
    });
  });

  describe("redirect=1 avec cookie invalide", () => {
    it.each(Object.entries(REJECTED_TARGETS))("%s", (_, target) => {
      expect(resolvePostLoginTarget({ search: "?redirect=1", cookieTarget: target }, POLICY)).toBe(
        FALLBACK,
      );
    });
  });
});

describe("readRedirectCookie", () => {
  it("lit et decode le cookie nomme parmi d'autres", () => {
    expect(readRedirectCookie(`a=1; ${COOKIE}=%2Fdash%3Fx%3D1; b=2`, COOKIE)).toBe("/dash?x=1");
  });

  it("renvoie null si le cookie est absent", () => {
    expect(readRedirectCookie("a=1; b=2", COOKIE)).toBeNull();
  });

  it("renvoie null pour un en-tete vide", () => {
    expect(readRedirectCookie("", COOKIE)).toBeNull();
  });

  it("ne confond pas un cookie dont le nom contient le nom cherche", () => {
    expect(readRedirectCookie(`x${COOKIE}=%2Fevil; ${COOKIE}_old=%2Fold`, COOKIE)).toBeNull();
  });

  it("traite le nom de cookie litteralement", () => {
    expect(readRedirectCookie("aXb=%2Fevil", "a.b")).toBeNull();
  });

  it("ne leve pas sur un encodage invalide", () => {
    expect(() => readRedirectCookie(`${COOKIE}=%E0%A4%A`, COOKIE)).not.toThrow();
  });

  it("cookie valide lu puis resolu vers sa cible", () => {
    const cookieTarget = readRedirectCookie(`${COOKIE}=${encodeURIComponent("/dash")}`, COOKIE);
    expect(resolvePostLoginTarget({ search: "?redirect=1", cookieTarget }, POLICY)).toBe("/dash");
  });

  it("cookie malveillant lu puis resolu vers le fallback", () => {
    const cookieTarget = readRedirectCookie(
      `${COOKIE}=${encodeURIComponent("//evil.test")}`,
      COOKIE,
    );
    expect(resolvePostLoginTarget({ search: "?redirect=1", cookieTarget }, POLICY)).toBe(FALLBACK);
  });
});

describe("loginRedirectPath", () => {
  it("renvoie la page de connexion avec retour vers le compte", () => {
    const path = loginRedirectPath();
    expect(new URL(path, "https://portal.example.test").pathname).toBe("/login");
    expect(redirectParamOf(path)).toBe("/account");
  });

  it("transporte une cible acceptee par safeRedirect", () => {
    const target = redirectParamOf(loginRedirectPath());
    expect(safeRedirect(target, POLICY)).toBe(target);
  });

  it("est stable d'un appel a l'autre", () => {
    expect(loginRedirectPath()).toBe(loginRedirectPath());
  });
});
