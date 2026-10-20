import type { CanopLayoutProps, CanopThemeProviderProps } from "@canop/ui";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AuthPortalConfigError,
  DEFAULT_REDIRECT_COOKIE_NAME,
  authPortalMessages,
  createAuthApp,
  safeRedirect,
  type AuthPortalConfig,
} from "../index";
import { captureDocumentNavigation, stubAuthApi } from "./authPortalTestKit";

const captured = vi.hoisted(() => ({
  layouts: [] as unknown[],
  themes: [] as unknown[],
}));

vi.mock("@canop/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@canop/ui")>();
  return {
    ...actual,
    Layout: (props: CanopLayoutProps) => {
      captured.layouts.push(props);
      return <actual.Layout {...props} />;
    },
    CanopThemeProvider: (props: CanopThemeProviderProps) => {
      captured.themes.push(props);
      return <actual.CanopThemeProvider {...props} />;
    },
  };
});

const BASE: AuthPortalConfig = {
  appName: "Acme Portal",
  terms: { version: "v7", effectiveDate: "2026-03-01" },
};

function lastLayout(): CanopLayoutProps {
  return captured.layouts.at(-1) as CanopLayoutProps;
}

function lastTheme(): CanopThemeProviderProps {
  return captured.themes.at(-1) as CanopThemeProviderProps;
}

function messageKeyOf(frenchText: string): string {
  const entry = Object.entries(authPortalMessages.fr).find(([, value]) => value === frenchText);
  if (!entry) throw new Error(`cle introuvable pour ${frenchText}`);
  return entry[0];
}

function renderApp(config: AuthPortalConfig, url = "/login") {
  captured.layouts.length = 0;
  captured.themes.length = 0;
  const base = config.apiBasePath ?? "/api/auth";
  const api = stubAuthApi({ [`POST ${base}/login`]: { status: 200, body: {} } });
  window.history.pushState({}, "", url);
  const App = createAuthApp(config);
  render(<App />);
  return api;
}

function withRedirect(redirect: AuthPortalConfig["redirect"]): AuthPortalConfig {
  return { ...BASE, redirect };
}

describe("createAuthApp - config valide", () => {
  it("renvoie un composant sans lever", () => {
    expect(typeof createAuthApp(BASE)).toBe("function");
  });

  it("accepte une config complete", () => {
    expect(() =>
      createAuthApp({
        ...BASE,
        apiBasePath: "/gw/auth",
        defaultLocale: "en",
        branding: { maxWidth: "40rem", showUtilities: false, animatedShapes: false },
        redirect: {
          trustedOrigins: ["https://app.example.test", "http://localhost:5173"],
          fallbackRedirect: "/home",
          cookieName: "acme_redirect",
          cookieDomain: ".example.test",
        },
      }),
    ).not.toThrow();
  });
});

const ERROR_PREFIX = "Config du portail d'authentification invalide : ";

function errorOf(config: unknown): unknown {
  try {
    createAuthApp(config as AuthPortalConfig);
  } catch (error) {
    return error;
  }
  return null;
}

function expectConfigError(config: unknown) {
  const error = errorOf(config);
  expect(error).toBeInstanceOf(AuthPortalConfigError);
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).name).toBe("AuthPortalConfigError");
  expect((error as Error).message.startsWith(ERROR_PREFIX)).toBe(true);
  expect((error as Error).message.length).toBeGreaterThan(ERROR_PREFIX.length);
}

function withTerms(terms: Record<string, unknown>): unknown {
  return { ...BASE, terms: { ...BASE.terms, ...terms } };
}

describe("createAuthApp - config invalide echoue des l'appel avec AuthPortalConfigError", () => {
  it.each([
    ["origine non URL", { trustedOrigins: ["not a url"] }],
    ["origine javascript:", { trustedOrigins: ["javascript:alert(1)"] }],
    ["origine ftp", { trustedOrigins: ["ftp://app.example.test"] }],
    ["origine avec identifiants", { trustedOrigins: ["https://user:pass@app.example.test"] }],
    ["origine joker", { trustedOrigins: ["*"] }],
    ["origine avec chemin", { trustedOrigins: ["https://app.example.test/path"] }],
    ["origine avec query", { trustedOrigins: ["https://app.example.test?x=1"] }],
    ["origine avec query apres slash", { trustedOrigins: ["https://app.example.test/?x=1"] }],
    ["origine avec ancre", { trustedOrigins: ["https://app.example.test#x"] }],
    ["trustedOrigins chaine", { trustedOrigins: "https://app.example.test" }],
    ["trustedOrigins objet", { trustedOrigins: { 0: "https://app.example.test" } }],
    ["origine non chaine", { trustedOrigins: [42] }],
    ["fallback protocol-relative", { fallbackRedirect: "//evil.test" }],
    ["fallback backslash", { fallbackRedirect: "/\\evil.test" }],
    ["fallback javascript:", { fallbackRedirect: "javascript:alert(1)" }],
    ["fallback absolu hors confiance", { fallbackRedirect: "https://evil.test/" }],
    ["fallback vide", { fallbackRedirect: "" }],
    ["fallback non chaine", { fallbackRedirect: 42 }],
    ["cookie au nom vide", { cookieName: "" }],
    ["cookie au nom avec espace", { cookieName: "bad name" }],
    ["cookie au nom avec point-virgule", { cookieName: "a;b" }],
    ["cookie au nom avec egal", { cookieName: "a=b" }],
    ["cookie au nom non chaine", { cookieName: 42 }],
    ["cookie __Host-", { cookieName: "__Host-redirect" }],
    ["cookie __host- minuscules", { cookieName: "__host-redirect" }],
    ["cookie __HOST- majuscules", { cookieName: "__HOST-redirect" }],
    ["cookie __Secure-", { cookieName: "__Secure-redirect" }],
    ["cookie __secure- minuscules", { cookieName: "__secure-redirect" }],
    ["cookie __SeCuRe- casse mixte", { cookieName: "__SeCuRe-redirect" }],
    ["cookieDomain avec injection d'attribut", { cookieDomain: "example.test; Path=/" }],
    ["cookieDomain avec espace", { cookieDomain: "exa mple.test" }],
    ["cookieDomain non chaine", { cookieDomain: 42 }],
  ])("redirect : %s", (_, redirect) => {
    expectConfigError({ ...BASE, redirect });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["chaine", "config"],
    ["nombre", 42],
    ["booleen", true],
  ])("config %s", (_, config) => {
    expectConfigError(config);
  });

  it.each([
    ["terms absent", { appName: "Acme" }],
    ["terms null", { appName: "Acme", terms: null }],
    ["terms chaine", { appName: "Acme", terms: "v1" }],
    ["appName absent", { terms: BASE.terms }],
    ["appName vide", { ...BASE, appName: "" }],
    ["appName non chaine", { ...BASE, appName: 42 }],
    ["redirect chaine", { ...BASE, redirect: "x" }],
    ["redirect nombre", { ...BASE, redirect: 42 }],
    ["redirect liste", { ...BASE, redirect: ["x"] }],
    ["redirect null", { ...BASE, redirect: null }],
    ["branding chaine", { ...BASE, branding: "x" }],
    ["branding.theme chaine", { ...BASE, branding: { theme: "dark" } }],
    ["branding.animatedShapes chaine", { ...BASE, branding: { animatedShapes: "no" } }],
    ["messages chaine", { ...BASE, messages: "x" }],
    ["terms.services chaine", { ...BASE, terms: { ...BASE.terms, services: "admin" } }],
    ["terms.services non chaines", { ...BASE, terms: { ...BASE.terms, services: [1] } }],
    ["appName blanc", { ...BASE, appName: "   " }],
  ])("%s", (_, config) => {
    expectConfigError(config);
  });

  it.each([
    ["version vide", { version: "" }],
    ["version non chaine", { version: 1 }],
    ["date libre", { effectiveDate: "not-a-date" }],
    ["date vide", { effectiveDate: "" }],
    ["date format francais", { effectiveDate: "01/03/2026" }],
    ["date sans zeros", { effectiveDate: "2026-3-1" }],
    ["date avec heure", { effectiveDate: "2026-03-01T00:00:00Z" }],
    ["mois 13", { effectiveDate: "2026-13-01" }],
    ["jour 00", { effectiveDate: "2026-03-00" }],
    ["30 fevrier", { effectiveDate: "2026-02-30" }],
    ["29 fevrier non bissextile", { effectiveDate: "2026-02-29" }],
    ["31 avril", { effectiveDate: "2026-04-31" }],
  ])("terms : %s", (_, terms) => {
    expectConfigError(withTerms(terms));
  });

  it.each([
    ["vide", ""],
    ["absolu https", "https://evil.test/auth"],
    ["absolu http", "http://localhost:8080/auth"],
    ["protocol-relative", "//evil.test/auth"],
    ["backslash", "/api\\auth"],
    ["tabulation", "/api\tauth"],
    ["saut de ligne", "/api\nauth"],
    ["caractere nul", "/api\u0000auth"],
    ["non chaine", 42],
  ])("apiBasePath %s", (_, apiBasePath) => {
    expectConfigError({ ...BASE, apiBasePath });
  });

  it.each([
    ["de", "de"],
    ["vide", ""],
    ["non chaine", 1],
  ])("defaultLocale %s", (_, defaultLocale) => {
    expectConfigError({ ...BASE, defaultLocale });
  });
});

describe("createAuthApp - configs valides non regressees", () => {
  it.each([
    ["origine vide toleree", { trustedOrigins: [""] }],
    ["origine sans slash final", { trustedOrigins: ["https://app.example.test"] }],
    ["origine avec slash final", { trustedOrigins: ["https://app.example.test/"] }],
    ["origine localhost avec port et slash", { trustedOrigins: ["http://localhost:5173/"] }],
    ["origine en majuscules", { trustedOrigins: ["https://APP.EXAMPLE.TEST"] }],
    ["cookie neutre", { cookieName: "acme_redirect" }],
    ["cookie contenant Host sans prefixe", { cookieName: "my__Host-redirect" }],
    [
      "fallback absolu d'une origine de confiance avec slash final",
      {
        trustedOrigins: ["https://app.example.test/"],
        fallbackRedirect: "https://app.example.test/home",
      },
    ],
  ])("redirect : %s", (_, redirect) => {
    expect(() => createAuthApp(withRedirect(redirect))).not.toThrow();
  });

  it.each([
    ["29 fevrier bissextile", "2028-02-29"],
    ["31 decembre", "2026-12-31"],
  ])("terms : %s", (_, effectiveDate) => {
    expect(() => createAuthApp(withTerms({ effectiveDate }) as AuthPortalConfig)).not.toThrow();
  });

  it.each(["/api/auth", "/gw/acme-auth", "/"])("apiBasePath %s", (apiBasePath) => {
    expect(() => createAuthApp({ ...BASE, apiBasePath })).not.toThrow();
  });

  it.each(["fr", "en"] as const)("defaultLocale %s", (defaultLocale) => {
    expect(() => createAuthApp({ ...BASE, defaultLocale })).not.toThrow();
  });

  it.each([
    ["redirect absent", { ...BASE }],
    ["redirect undefined", { ...BASE, redirect: undefined }],
    [
      "branding complet, theme, messages fr/en et services",
      {
        ...BASE,
        terms: { ...BASE.terms, services: ["authenticator", "admin"] },
        branding: {
          logo: <span>A</span>,
          header: <span>H</span>,
          maxWidth: "40rem",
          showUtilities: true,
          animatedShapes: false,
          theme: { defaultMode: "dark" as const, storageKey: "acme-theme" },
        },
        messages: {
          fr: { "auth.cgu.services.admin": "Console" },
          en: { "auth.cgu.services.admin": "Console" },
        },
        defaultLocale: "en" as const,
      },
    ],
  ])("config : %s", (_, config) => {
    expect(() => createAuthApp(config)).not.toThrow();
  });

  it("une origine vide ne rend aucune URL absolue de confiance", () => {
    expect(
      safeRedirect("https://evil.test/", { trustedOrigins: [""], fallbackRedirect: "/account" }),
    ).toBe("/account");
  });

  it("le nom de cookie par defaut est neutre", () => {
    expect(DEFAULT_REDIRECT_COOKIE_NAME).not.toMatch(/^(ch|ml)_|malo|custhome|budgy|drive/i);
  });
});

describe("createAuthApp - branding pilote par la config", () => {
  it("affiche appName dans l'en-tete et le titre d'onglet", async () => {
    renderApp(BASE);
    expect(await screen.findByText("Acme Portal")).toBeInTheDocument();
    await waitFor(() => expect(document.title).toContain("Acme Portal"));
  });

  it("transmet logo, header, maxWidth, showUtilities et animatedShapes au Layout", () => {
    const logo = <span data-testid="acme-logo">A</span>;
    const header = <span data-testid="acme-header">Acme header</span>;
    renderApp({
      ...BASE,
      branding: { logo, header, maxWidth: "42rem", showUtilities: false, animatedShapes: false },
    });
    expect(lastLayout()).toMatchObject({
      logo,
      header,
      maxWidth: "42rem",
      showUtilities: false,
      animatedShapes: false,
    });
    expect(screen.getByTestId("acme-header")).toBeInTheDocument();
  });

  it("active les formes animees par defaut", () => {
    renderApp(BASE);
    expect(lastLayout().animatedShapes).toBe(true);
  });

  it("transmet le theme configure au CanopThemeProvider", () => {
    renderApp({
      ...BASE,
      branding: { theme: { defaultMode: "dark", storageKey: "acme-theme" } },
    });
    expect(lastTheme()).toMatchObject({ defaultMode: "dark", storageKey: "acme-theme" });
  });

  it("utilise le mode system par defaut", () => {
    renderApp(BASE);
    expect(lastTheme()).toMatchObject({ defaultMode: "system" });
  });
});

describe("createAuthApp - messages et langue", () => {
  it("surcharge un texte francais via messages.fr", async () => {
    const key = messageKeyOf("Se connecter");
    renderApp({ ...BASE, messages: { fr: { [key]: "Entrer chez Acme" } } });
    expect(await screen.findByRole("button", { name: "Entrer chez Acme" })).toBeInTheDocument();
  });

  it("affiche l'anglais avec defaultLocale en", async () => {
    const key = messageKeyOf("Se connecter");
    renderApp({ ...BASE, defaultLocale: "en" });
    expect(
      await screen.findByRole("button", { name: authPortalMessages.en[key] }),
    ).toBeInTheDocument();
  });

  it("surcharge un texte anglais via messages.en", async () => {
    const key = messageKeyOf("Se connecter");
    renderApp({ ...BASE, defaultLocale: "en", messages: { en: { [key]: "Enter Acme" } } });
    expect(await screen.findByRole("button", { name: "Enter Acme" })).toBeInTheDocument();
  });
});

describe("createAuthApp - CGU pilotees par terms", () => {
  it("affiche la version des CGU et les services configures", async () => {
    renderApp(
      {
        ...BASE,
        terms: { version: "v7", effectiveDate: "2026-03-01", services: ["authenticator", "admin"] },
        messages: { fr: { "auth.cgu.services.admin": "Console Acme" } },
      },
      "/cgu",
    );
    expect(await screen.findByText(/v7/)).toBeInTheDocument();
    expect(screen.getAllByText(/Console Acme/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Acme Portal/).length).toBeGreaterThan(0);
  });
});

describe("createAuthApp - apiBasePath", () => {
  async function submitLogin(config: AuthPortalConfig) {
    const api = renderApp(config);
    captureDocumentNavigation();
    const email = document.querySelector<HTMLInputElement>('input[type="email"]');
    const password = document.querySelector<HTMLInputElement>('input[type="password"]');
    if (!email || !password) throw new Error("formulaire de connexion introuvable");
    fireEvent.change(email, { target: { value: "ada@example.test" } });
    fireEvent.change(password, { target: { value: "s3cret-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    await waitFor(() => expect(api.calls.some((call) => call.method === "POST")).toBe(true));
    return api.calls.filter((call) => call.method === "POST").map((call) => call.url);
  }

  it("appelle l'API sous le apiBasePath configure", async () => {
    const urls = await submitLogin({ ...BASE, apiBasePath: "/gw/acme-auth" });
    expect(urls).toContain("/gw/acme-auth/login");
  });

  it("appelle l'API sous /api/auth par defaut", async () => {
    const urls = await submitLogin(BASE);
    expect(urls).toContain("/api/auth/login");
  });
});
