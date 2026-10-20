import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AUTH_PORTAL_PATHS, AuthPortal, AuthPortalConfigError, AuthPortalRoutes } from "../index";
import {
  currentLocation,
  findHeading,
  renderPortalAt,
  stubAuthApi,
  TEST_APP_NAME,
  TEST_CONFIG,
  TestProviders,
} from "./authPortalTestKit";

describe("routage du portail", () => {
  it("/ redirige vers la page de connexion", async () => {
    stubAuthApi();
    renderPortalAt("/");
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });

  it("une route inconnue retombe sur la connexion", async () => {
    stubAuthApi();
    renderPortalAt("/nimporte-quoi");
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });

  it("le layout affiche le nom de l'application", async () => {
    stubAuthApi();
    renderPortalAt("/login");
    expect(await findHeading(TEST_APP_NAME)).toBeInTheDocument();
  });

  it("le titre du document cite le nom de l'application", async () => {
    stubAuthApi();
    renderPortalAt("/login");
    await waitFor(() => expect(document.title).toBe(`${TEST_APP_NAME} - Authentification`));
  });

  it("/register affiche la page d'inscription", async () => {
    stubAuthApi();
    renderPortalAt("/register");
    expect(await findHeading("Créer un compte")).toBeInTheDocument();
  });

  it("/pending affiche la page de compte en attente avec retour a la connexion", async () => {
    stubAuthApi();
    renderPortalAt("/pending");
    expect(await findHeading("Compte en attente")).toBeInTheDocument();
    expect(screen.getByText(/en attente de validation par un administrateur/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à la connexion" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("affiche le logo fourni par le projet", async () => {
    stubAuthApi();
    renderPortalAt("/login", {
      config: { ...TEST_CONFIG, branding: { logo: <span data-testid="logo-projet">L</span> } },
    });
    expect(await screen.findByTestId("logo-projet")).toBeInTheDocument();
  });

  it("applique les surcharges de messages du projet", async () => {
    stubAuthApi();
    renderPortalAt("/login", { messages: { fr: { "auth.login.title": "Identification" } } });
    expect(await findHeading("Identification")).toBeInTheDocument();
  });

  it("s'affiche en anglais quand la locale par defaut est en", async () => {
    stubAuthApi();
    window.history.replaceState({}, "", "/login");
    render(<AuthPortal config={{ ...TEST_CONFIG, defaultLocale: "en" }} />);
    expect(await findHeading("Sign in")).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(`${TEST_APP_NAME} - Sign in`));
  });

  it("expose les chemins des routes du portail", () => {
    expect(AUTH_PORTAL_PATHS).toEqual({
      root: "/",
      login: "/login",
      register: "/register",
      forgotPassword: "/forgot-password",
      resetPassword: "/reset-password",
      pending: "/pending",
      cgu: "/cgu",
      account: "/account",
    });
  });

  it("compose AuthPortalProvider et AuthPortalRoutes dans le routeur du projet", async () => {
    stubAuthApi();
    render(
      <TestProviders url="/forgot-password">
        <AuthPortalRoutes />
      </TestProviders>,
    );
    expect(await findHeading("Mot de passe oublié")).toBeInTheDocument();
  });

  it("cible le chemin d'API configure par le projet", async () => {
    const stub = stubAuthApi({
      "GET /edge/auth/settings/registration": { status: 200, body: { enabled: true } },
    });
    renderPortalAt("/register", { config: { ...TEST_CONFIG, apiBasePath: "/edge/auth" } });
    await screen.findByLabelText(/^nom/i);
    expect(stub.callsTo("GET /edge/auth/settings/registration")).toHaveLength(1);
  });

  it("accepte directement la config brute du projet et la resout", async () => {
    const stub = stubAuthApi({
      "GET /brut/auth/settings/registration": { status: 200, body: { enabled: true } },
    });
    window.history.replaceState({}, "", "/register");
    render(
      <AuthPortal
        config={{
          appName: "Projet Brut",
          terms: { version: "v3", effectiveDate: "2026-05-01" },
          apiBasePath: "/brut/auth",
          defaultLocale: "en",
          branding: { header: <span data-testid="entete-brut">Brut</span> },
          messages: { en: { "auth.register.title": "Join Brut" } },
        }}
      />,
    );
    expect(await findHeading("Join Brut")).toBeInTheDocument();
    expect(screen.getByTestId("entete-brut")).toBeInTheDocument();
    expect(stub.callsTo("GET /brut/auth/settings/registration")).toHaveLength(1);
    await waitFor(() => expect(document.title).toContain("Projet Brut"));
  });

  it("applique les valeurs par defaut a une config brute minimale", async () => {
    const stub = stubAuthApi();
    window.history.replaceState({}, "", "/register");
    render(<AuthPortal config={{ appName: "Minimal", terms: TEST_CONFIG.terms }} />);
    expect(await findHeading("Créer un compte")).toBeInTheDocument();
    expect(stub.callsTo("GET /api/auth/settings/registration")).toHaveLength(1);
  });

  it("rejette une config brute invalide", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      render(<AuthPortal config={{ ...TEST_CONFIG, apiBasePath: "//evil.test" }} />),
    ).toThrow(AuthPortalConfigError);
  });
});
