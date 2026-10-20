import { navigateTo } from "@canop/ui";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthPortalConfigError,
  createAuthApp,
  resolveAuthPortalConfig,
  UsersPage,
  type AdminUser,
  type AuthPortalConfig,
} from "../index";
import {
  enterText,
  renderPortalAt,
  setupUser,
  STRONG_PASSWORD,
  stubAuthApi,
  TEST_CONFIG,
  TEST_ME,
  TestProviders,
  type ApiRoutes,
} from "./authPortalTestKit";

vi.mock("@canop/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@canop/ui")>()),
  navigateTo: vi.fn(),
}));

const ADMIN_BASE = "/api/admin";
const ADMIN_CONFIG: AuthPortalConfig = { ...TEST_CONFIG, adminApiBasePath: ADMIN_BASE };

const ALICE: AdminUser = {
  user_id: "u-alice",
  name: "Alice",
  email: "alice@example.test",
  roles: [],
  status: "active",
  whitelist_only: false,
  devices: [],
  created_at: "2026-01-01T00:00:00Z",
};

const adminRequests = (base: string) => [
  `GET ${base}/users?limit=100`,
  `GET ${base}/portals`,
  `GET ${base}/roles`,
];

const adminReplies = (base: string): ApiRoutes => {
  const [users, portals, roles] = adminRequests(base);
  return {
    [users]: { status: 200, body: { users: [ALICE], page: 1, limit: 100, total: 1 } },
    [portals]: { status: 200, body: [{ name: "books", audience: "books", open: false }] },
    [roles]: { status: 200, body: [] },
  };
};

function expiredSessionReplies(base: string): ApiRoutes {
  const sessionState = { refreshed: false };
  const fresh = adminReplies(base);
  const expiring = Object.fromEntries(
    Object.entries(fresh).map(([key, reply]) => [
      key,
      () => (sessionState.refreshed ? reply : { status: 401, body: { error: "unauthorized" } }),
    ]),
  );
  return {
    ...expiring,
    "POST /api/auth/refresh": () => {
      sessionState.refreshed = true;
      return { status: 200, body: {} };
    },
  } as ApiRoutes;
}

function renderUsersPage(config: AuthPortalConfig, routes: ApiRoutes) {
  const stub = stubAuthApi(routes);
  render(
    <TestProviders config={config} url="/users">
      <UsersPage />
    </TestProviders>,
  );
  return stub;
}

function errorOf(config: AuthPortalConfig): unknown {
  try {
    createAuthApp(config);
  } catch (error) {
    return error;
  }
  return null;
}

beforeEach(() => {
  vi.mocked(navigateTo).mockReset();
});

describe("adminApiBasePath - les appels admin partent sur le chemin configure", () => {
  it("vaut apiBasePath par defaut", () => {
    expect(resolveAuthPortalConfig(TEST_CONFIG).adminApiBasePath).toBe("/api/auth");
    const custom = resolveAuthPortalConfig({ ...TEST_CONFIG, apiBasePath: "/gw/auth" });
    expect(custom.adminApiBasePath).toBe("/gw/auth");
  });

  it("envoie les appels admin sous adminApiBasePath", async () => {
    const stub = renderUsersPage(ADMIN_CONFIG, adminReplies(ADMIN_BASE));
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    adminRequests(ADMIN_BASE).forEach((key) => expect(stub.callsTo(key)).toHaveLength(1));
    expect(stub.calls.filter((call) => call.url.startsWith("/api/auth/"))).toEqual([]);
  });

  it("envoie les actions admin sous adminApiBasePath", async () => {
    const statusKey = `PUT ${ADMIN_BASE}/users/u-alice/status`;
    const stub = renderUsersPage(ADMIN_CONFIG, {
      ...adminReplies(ADMIN_BASE),
      [statusKey]: { status: 200, body: { ...ALICE, status: "disabled" } },
    });
    const user = setupUser();
    await user.click(await screen.findByRole("switch", { name: "Désactiver Alice" }));
    await waitFor(() => expect(stub.callsTo(statusKey)).toHaveLength(1));
  });

  it.each(["api/admin", "//api/admin", "", "https://evil.example/api/admin", "/\\api"])(
    "rejette au demarrage la valeur invalide %j",
    (adminApiBasePath) => {
      expect(errorOf({ ...TEST_CONFIG, adminApiBasePath })).toBeInstanceOf(AuthPortalConfigError);
    },
  );

  it.each(["/api/admin", "/gw/admin", "/"])("accepte la valeur valide %s", (adminApiBasePath) => {
    expect(() => createAuthApp({ ...TEST_CONFIG, adminApiBasePath })).not.toThrow();
  });
});

describe("refresh - toujours sur apiBasePath, une seule fois pour des 401 concurrents", () => {
  it("rafraichit sur /api/auth/refresh quand adminApiBasePath vaut /api/admin", async () => {
    const stub = renderUsersPage(ADMIN_CONFIG, expiredSessionReplies(ADMIN_BASE));
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(stub.callsTo("POST /api/auth/refresh")).toHaveLength(1);
    expect(stub.calls.filter((call) => call.url.startsWith(`${ADMIN_BASE}/refresh`))).toEqual([]);
  });

  it("rafraichit sur ${apiBasePath}/refresh avec un apiBasePath personnalise", async () => {
    const routes = expiredSessionReplies(ADMIN_BASE);
    const { ["POST /api/auth/refresh"]: refresh, ...admin } = routes;
    const stub = renderUsersPage(
      { ...ADMIN_CONFIG, apiBasePath: "/gw/auth" },
      { ...admin, "POST /gw/auth/refresh": refresh },
    );
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(stub.callsTo("POST /gw/auth/refresh")).toHaveLength(1);
    expect(stub.callsTo("POST /api/auth/refresh")).toHaveLength(0);
  });

  it("declenche exactement un refresh pour 3 requetes admin concurrentes en 401 puis les rejoue", async () => {
    const stub = renderUsersPage(ADMIN_CONFIG, expiredSessionReplies(ADMIN_BASE));
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    await waitFor(() =>
      adminRequests(ADMIN_BASE).forEach((key) => expect(stub.callsTo(key)).toHaveLength(2)),
    );
    expect(stub.callsTo("POST /api/auth/refresh")).toHaveLength(1);
  });

  it("partage le refresh entre les requetes admin du portail complet", async () => {
    const stub = stubAuthApi({
      ...expiredSessionReplies(ADMIN_BASE),
      "GET /api/auth/me": { status: 200, body: { ...TEST_ME, roles: ["admin"] } },
    });
    renderPortalAt("/users", { config: { ...ADMIN_CONFIG, admin: true } });
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(stub.callsTo("POST /api/auth/refresh")).toHaveLength(1);
    adminRequests(ADMIN_BASE).forEach((key) => expect(stub.callsTo(key)).toHaveLength(2));
  });

  it("declenche un seul refresh avec le chemin admin par defaut", async () => {
    const stub = renderUsersPage(TEST_CONFIG, expiredSessionReplies("/api/auth"));
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(stub.callsTo("POST /api/auth/refresh")).toHaveLength(1);
  });
});

describe("login, register et logout restent sur apiBasePath", () => {
  it("connecte via /api/auth/login", async () => {
    const stub = stubAuthApi({ "POST /api/auth/login": { status: 200, body: {} } });
    renderPortalAt("/login", { config: ADMIN_CONFIG });
    const user = setupUser();
    await enterText(user, await screen.findByLabelText(/email/i), "a@b.test");
    await enterText(user, screen.getByLabelText(/mot de passe/i), "secret123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));
    await waitFor(() => expect(stub.callsTo("POST /api/auth/login")).toHaveLength(1));
    expect(stub.calls.filter((call) => call.url.startsWith(ADMIN_BASE))).toEqual([]);
  });

  it("inscrit via /api/auth/register", async () => {
    const stub = stubAuthApi({ "POST /api/auth/register": { status: 201, body: {} } });
    renderPortalAt("/register", { config: ADMIN_CONFIG });
    const user = setupUser();
    await enterText(user, await screen.findByLabelText(/^nom/i), "Camille");
    await enterText(user, screen.getByLabelText(/^email/i), "nouveau@example.test");
    await enterText(user, screen.getByLabelText(/^mot de passe/i), STRONG_PASSWORD);
    await enterText(user, screen.getByLabelText(/confirmation/i), STRONG_PASSWORD);
    await user.click(screen.getByRole("checkbox", { name: /j'ai lu et j'accepte les/i }));
    await user.click(screen.getByRole("button", { name: /créer le compte/i }));
    await waitFor(() => expect(stub.callsTo("POST /api/auth/register")).toHaveLength(1));
    expect(stub.calls.filter((call) => call.url.startsWith(ADMIN_BASE))).toEqual([]);
  });

  it("deconnecte via /api/auth/logout", async () => {
    const stub = stubAuthApi({
      "GET /api/auth/me": { status: 200, body: TEST_ME },
      "POST /api/auth/logout": { status: 204 },
    });
    renderPortalAt("/account", { config: ADMIN_CONFIG });
    const user = setupUser();
    await user.click(await screen.findByRole("button", { name: /se déconnecter/i }));
    await waitFor(() => expect(stub.callsTo("POST /api/auth/logout")).toHaveLength(1));
    expect(stub.calls.filter((call) => call.url.startsWith(ADMIN_BASE))).toEqual([]);
  });
});
