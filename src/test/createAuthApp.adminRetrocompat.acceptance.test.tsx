import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createAuthApp, type AdminPortal, type AdminUser, type AuthPortalConfig } from "../index";
import {
  currentLocation,
  findHeading,
  stubAuthApi,
  TEST_CONFIG,
  TEST_ME,
  type ApiRoutes,
} from "./authPortalTestKit";

const BOB: AdminUser = {
  user_id: "u-bob",
  name: "Bob Retro",
  email: "bob@example.test",
  roles: [],
  status: "active",
  whitelist_only: false,
  devices: [],
  created_at: "2026-01-01T00:00:00Z",
};

const portal = (name: string): AdminPortal => ({ name, audience: `aud-${name}`, open: false });

const adminRoutesUnder = (base: string): ApiRoutes => ({
  "GET /api/auth/me": { status: 200, body: { ...TEST_ME, roles: ["admin"] } },
  [`GET ${base}/users?limit=100`]: {
    status: 200,
    body: { users: [BOB], page: 1, limit: 100, total: 1 },
  },
  [`GET ${base}/portals`]: { status: 200, body: [portal("authenticator"), portal("archives")] },
  [`GET ${base}/roles`]: { status: 200, body: [] },
});

const ADMIN_CONFIG: AuthPortalConfig = { ...TEST_CONFIG, admin: true };

function renderAt(url: string, config: AuthPortalConfig, routes: ApiRoutes) {
  const api = stubAuthApi(routes);
  window.history.replaceState({}, "", url);
  const App = createAuthApp(config);
  render(<App />);
  return api;
}

describe("Retrocompatibilite 0.3.0 - createAuthApp avec admin: true", () => {
  it("Given admin: true, When /users s'ouvre, Then la page liste les utilisateurs via /api/auth", async () => {
    const api = renderAt("/users", ADMIN_CONFIG, adminRoutesUnder("/api/auth"));

    expect(await screen.findByText("Bob Retro")).toBeInTheDocument();
    expect(currentLocation()).toBe("/users");
    expect(api.callsTo("GET /api/auth/users?limit=100").length).toBeGreaterThan(0);
  });

  it("Given admin: true, When /portals s'ouvre, Then les portails de l'API sont affiches", async () => {
    renderAt("/portals", ADMIN_CONFIG, adminRoutesUnder("/api/auth"));

    expect((await screen.findAllByText("archives")).length).toBeGreaterThan(0);
    expect(currentLocation()).toBe("/portals");
  });

  it("Given admin: true, When /roles s'ouvre, Then une carte par portail est affichee", async () => {
    renderAt("/roles", ADMIN_CONFIG, adminRoutesUnder("/api/auth"));

    expect(
      await screen.findByRole("button", { name: "Ajouter un sous-rôle à archives" }),
    ).toBeInTheDocument();
    expect(currentLocation()).toBe("/roles");
  });

  it("Given admin: true et adminApiBasePath /api/admin, When /users s'ouvre, Then les appels admin partent sous /api/admin", async () => {
    const api = renderAt(
      "/users",
      { ...ADMIN_CONFIG, adminApiBasePath: "/api/admin" },
      adminRoutesUnder("/api/admin"),
    );

    expect(await screen.findByText("Bob Retro")).toBeInTheDocument();
    expect(api.callsTo("GET /api/admin/users?limit=100").length).toBeGreaterThan(0);
    expect(api.callsTo("GET /api/auth/users?limit=100")).toHaveLength(0);
  });

  it("Given admin: true, When /login s'ouvre, Then la page de connexion reste disponible", async () => {
    renderAt("/login", ADMIN_CONFIG, adminRoutesUnder("/api/auth"));

    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });

  it("Given admin: true avec un branding.footer, When /users s'ouvre, Then la page admin s'affiche toujours", async () => {
    renderAt(
      "/users",
      { ...ADMIN_CONFIG, branding: { footer: <p data-testid="retro-footer">Pied</p> } },
      adminRoutesUnder("/api/auth"),
    );

    expect(await screen.findByText("Bob Retro")).toBeInTheDocument();
    expect(screen.getByTestId("retro-footer")).toBeInTheDocument();
  });
});
