import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_REDIRECT_COOKIE_NAME, createAuthApp, type AuthPortalConfig } from "../index";
import {
  captureCookieWrites,
  captureDocumentNavigation,
  stubAuthApi,
  type ApiStub,
} from "./authPortalTestKit";

const COOKIE_NAME = "acme_redirect";
const COOKIE_DOMAIN = "localhost";
const FALLBACK = "/home";

const CONFIG: AuthPortalConfig = {
  appName: "Acme",
  terms: { version: "v1", effectiveDate: "2026-01-01" },
  apiBasePath: "/custom/auth",
  redirect: {
    trustedOrigins: ["https://app.example.test"],
    fallbackRedirect: FALLBACK,
    cookieName: COOKIE_NAME,
    cookieDomain: COOKIE_DOMAIN,
  },
};

const MALICIOUS_TARGETS = [
  "//evil.test",
  "/\\evil.test",
  "%2f%5Cevil.test",
  "/%2f/evil.test",
  "%252F%252Fevil.test",
  "/\t/evil.test",
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "https://user:pass@app.example.test/",
  "https://app.example.test.evil.com/",
  "http://app.example.test/",
  "https://app.example.test:8443/",
  "https://evil.test/",
];

let navigations: string[];
let cookieWrites: string[];

beforeEach(() => {
  navigations = captureDocumentNavigation();
  cookieWrites = captureCookieWrites();
});

const LOGIN = "POST /custom/auth/login";

function stubLoginApi(loginStatus = 200): ApiStub {
  return stubAuthApi({
    [LOGIN]: { status: loginStatus, body: loginStatus === 200 ? {} : { error: "invalid" } },
  });
}

function destination(): string {
  return navigations.at(-1) ?? `${window.location.pathname}${window.location.search}`;
}

function openLogin(url: string, config: AuthPortalConfig = CONFIG) {
  window.history.pushState({}, "", url);
  const App = createAuthApp(config);
  render(<App />);
}

function signIn() {
  const email = document.querySelector<HTMLInputElement>('input[type="email"]');
  const password = document.querySelector<HTMLInputElement>('input[type="password"]');
  if (!email || !password) throw new Error("formulaire de connexion introuvable");
  fireEvent.change(email, { target: { value: "ada@example.test" } });
  fireEvent.change(password, { target: { value: "s3cret-pass" } });
  fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
}

function loginWithRedirect(target: string) {
  openLogin(`/login?redirect=${encodeURIComponent(target)}`);
  signIn();
}

function redirectCookieExpiries(): string[] {
  return cookieWrites.filter((write) => write.startsWith(`${COOKIE_NAME}=`));
}

describe("parcours de connexion - redirection apres succes", () => {
  it("appelle l'API de login sous apiBasePath avec les identifiants saisis", async () => {
    const api = stubLoginApi();
    loginWithRedirect("/dashboard");
    await waitFor(() =>
      expect(api.calls.some((call) => call.url === "/custom/auth/login")).toBe(true),
    );
    const login = api.calls.find((call) => call.url === "/custom/auth/login");
    expect(login?.method).toBe("POST");
    expect(login?.body).toMatchObject({ email: "ada@example.test", password: "s3cret-pass" });
  });

  it("redirige vers un chemin relatif propre", async () => {
    stubLoginApi();
    loginWithRedirect("/dashboard?tab=1");
    await waitFor(() => expect(destination()).toBe("/dashboard?tab=1"));
  });

  it("redirige vers une URL absolue d'une origine de confiance", async () => {
    stubLoginApi();
    loginWithRedirect("https://app.example.test/home?x=1");
    await waitFor(() => expect(destination()).toBe("https://app.example.test/home?x=1"));
  });

  it("redirige vers fallbackRedirect sans parametre redirect", async () => {
    stubLoginApi();
    openLogin("/login");
    signIn();
    await waitFor(() => expect(destination()).toBe(FALLBACK));
  });

  it.each(MALICIOUS_TARGETS)("redirige vers fallbackRedirect pour %j", async (target) => {
    stubLoginApi();
    loginWithRedirect(target);
    await waitFor(() => expect(destination()).toBe(FALLBACK));
  });
});

describe("parcours de connexion - cookie de redirection", () => {
  it("redirect=1 avec cookie valide redirige vers la cible du cookie", async () => {
    stubLoginApi();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent("/from-cookie")}; Path=/`;
    openLogin("/login?redirect=1");
    signIn();
    await waitFor(() => expect(destination()).toBe("/from-cookie"));
  });

  it("redirect=1 avec cookie d'une origine de confiance", async () => {
    stubLoginApi();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent("https://app.example.test/x")}; Path=/`;
    openLogin("/login?redirect=1");
    signIn();
    await waitFor(() => expect(destination()).toBe("https://app.example.test/x"));
  });

  it("redirect=1 avec cookie invalide redirige vers fallbackRedirect", async () => {
    stubLoginApi();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent("//evil.test")}; Path=/`;
    openLogin("/login?redirect=1");
    signIn();
    await waitFor(() => expect(destination()).toBe(FALLBACK));
  });

  it("redirect=1 sans cookie redirige vers fallbackRedirect", async () => {
    stubLoginApi();
    openLogin("/login?redirect=1");
    signIn();
    await waitFor(() => expect(destination()).toBe(FALLBACK));
  });

  it("le cookie est efface avec son domain apres connexion", async () => {
    stubLoginApi();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent("/from-cookie")}; Path=/`;
    openLogin("/login?redirect=1");
    signIn();
    await waitFor(() => expect(destination()).toBe("/from-cookie"));
    const expiries = redirectCookieExpiries();
    expect(expiries.length).toBeGreaterThan(0);
    expect(expiries.at(-1)).toMatch(new RegExp(`domain=\\.?${COOKIE_DOMAIN}`, "i"));
    expect(expiries.at(-1)).toMatch(/max-age=0|expires=thu, 01 jan 1970/i);
    expect(document.cookie).not.toContain(`${COOKIE_NAME}=`);
  });

  it("le cookie invalide est aussi consomme apres connexion", async () => {
    stubLoginApi();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent("//evil.test")}; Path=/`;
    openLogin("/login?redirect=1");
    signIn();
    await waitFor(() => expect(destination()).toBe(FALLBACK));
    expect(redirectCookieExpiries().length).toBeGreaterThan(0);
    expect(document.cookie).not.toContain(`${COOKIE_NAME}=`);
  });

  it("le cookie est efface sans domain quand cookieDomain n'est pas configure", async () => {
    stubLoginApi();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent("/from-cookie")}; Path=/`;
    openLogin("/login?redirect=1", {
      ...CONFIG,
      redirect: { ...CONFIG.redirect, cookieDomain: undefined },
    });
    signIn();
    await waitFor(() => expect(destination()).toBe("/from-cookie"));
    expect(redirectCookieExpiries().at(-1)).not.toMatch(/domain=/i);
    expect(document.cookie).not.toContain(`${COOKIE_NAME}=`);
  });
});

describe("parcours de connexion - configs par defaut et origines normalisees", () => {
  it("lit puis efface le cookie de redirection par defaut sans cookieName configure", async () => {
    stubLoginApi();
    const target = encodeURIComponent("/from-default");
    document.cookie = `${DEFAULT_REDIRECT_COOKIE_NAME}=${target}; Path=/`;
    openLogin("/login?redirect=1", {
      ...CONFIG,
      redirect: { trustedOrigins: [], fallbackRedirect: FALLBACK },
    });
    signIn();
    await waitFor(() => expect(destination()).toBe("/from-default"));
    expect(document.cookie).not.toContain(`${DEFAULT_REDIRECT_COOKIE_NAME}=`);
  });

  it("fait confiance a une origine configuree avec slash final", async () => {
    stubLoginApi();
    openLogin(`/login?redirect=${encodeURIComponent("https://app.example.test/x")}`, {
      ...CONFIG,
      redirect: { ...CONFIG.redirect, trustedOrigins: ["https://app.example.test/"] },
    });
    signIn();
    await waitFor(() => expect(destination()).toBe("https://app.example.test/x"));
  });

  it("ne fait confiance a rien avec une origine vide", async () => {
    stubLoginApi();
    openLogin(`/login?redirect=${encodeURIComponent("https://evil.test/")}`, {
      ...CONFIG,
      redirect: { ...CONFIG.redirect, trustedOrigins: [""] },
    });
    signIn();
    await waitFor(() => expect(destination()).toBe(FALLBACK));
  });
});

describe("parcours de connexion - echec", () => {
  it("ne redirige pas quand l'API refuse les identifiants", async () => {
    const api = stubLoginApi(401);
    loginWithRedirect("/dashboard");
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
    expect(api.callsTo(LOGIN)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(navigations).toEqual([]);
    expect(window.location.pathname).toBe("/login");
  });
});
