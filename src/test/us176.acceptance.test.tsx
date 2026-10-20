import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ADMIN_PORTAL_PATHS,
  AuthPortalConfigError,
  createAuthApp,
  type AdminPortal,
  type AdminUser,
  type AuthPortalConfig,
} from "../index";
import {
  currentLocation,
  findHeading,
  stubAuthApi,
  TEST_CONFIG,
  TEST_ME,
  type ApiRoutes,
} from "./authPortalTestKit";

const ERROR_PREFIX = "Config du portail d'authentification invalide : ";

const ADMIN_REQUESTS = [
  "GET /api/auth/users?limit=100",
  "GET /api/auth/portals",
  "GET /api/auth/roles",
];

const portal = (name: string): AdminPortal => ({ name, audience: `aud-${name}`, open: false });

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

const adminReplies: ApiRoutes = {
  "GET /api/auth/users?limit=100": {
    status: 200,
    body: { users: [ALICE], page: 1, limit: 100, total: 1 },
  },
  "GET /api/auth/portals": { status: 200, body: ["authenticator", "books"].map(portal) },
  "GET /api/auth/roles": { status: 200, body: [] },
};

const signedInAdmin: ApiRoutes = {
  ...adminReplies,
  "GET /api/auth/me": { status: 200, body: { ...TEST_ME, roles: ["admin"] } },
};

const ADMIN_PATHS = Object.values(ADMIN_PORTAL_PATHS);

function renderAppAt(url: string, config: unknown, routes: ApiRoutes = adminReplies) {
  const api = stubAuthApi(routes);
  window.history.replaceState({}, "", url);
  const App = createAuthApp(config as AuthPortalConfig);
  render(<App />);
  return api;
}

function adminCallsOf(api: ReturnType<typeof stubAuthApi>) {
  return ADMIN_REQUESTS.flatMap((key) => api.callsTo(key));
}

function startupErrorOf(config: unknown): unknown {
  try {
    createAuthApp(config as AuthPortalConfig);
  } catch (error) {
    return error;
  }
  return null;
}

async function settledLocationOf(url: string, config: unknown, routes: ApiRoutes) {
  renderAppAt(url, config, routes);
  await waitFor(() => expect(currentLocation()).not.toBe(url));
  await findHeading("Connexion");
  const location = currentLocation();
  cleanup();
  return location;
}

describe("AC1 - createAuthApp accepte une option admin booleenne, false par defaut", () => {
  it.each([true, false])("accepte admin: %s dans le type et a l'execution", (admin) => {
    const config: AuthPortalConfig = { ...TEST_CONFIG, admin };
    expect(typeof createAuthApp(config)).toBe("function");
  });

  it("se comporte sans option comme avec admin: false", async () => {
    const withoutOption = await settledLocationOf("/users", TEST_CONFIG, signedInAdmin);
    const withFalse = await settledLocationOf(
      "/users",
      { ...TEST_CONFIG, admin: false },
      signedInAdmin,
    );
    expect(withoutOption).toBe(withFalse);
    expect(withoutOption).not.toBe("/users");
  });
});

describe("AC2 - avec admin: true, /users, /roles et /portals sont montees", () => {
  const adminConfig = { ...TEST_CONFIG, admin: true };

  it("affiche la page /users avec les utilisateurs de l'API", async () => {
    const api = renderAppAt(ADMIN_PORTAL_PATHS.users, adminConfig, signedInAdmin);
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(currentLocation()).toBe("/users");
    expect(api.callsTo("GET /api/auth/users?limit=100").length).toBeGreaterThan(0);
  });

  it("affiche la page /roles avec une carte par portail", async () => {
    renderAppAt(ADMIN_PORTAL_PATHS.roles, adminConfig, signedInAdmin);
    const buttons = await screen.findAllByRole("button", { name: /^Ajouter un sous-rôle à / });
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Ajouter un sous-rôle à authenticator",
      "Ajouter un sous-rôle à books",
    ]);
    expect(currentLocation()).toBe("/roles");
  });

  it("affiche la page /portals avec les portails de l'API", async () => {
    const api = renderAppAt(ADMIN_PORTAL_PATHS.portals, adminConfig, signedInAdmin);
    expect(await screen.findAllByText("books")).not.toHaveLength(0);
    expect(currentLocation()).toBe("/portals");
    expect(api.callsTo("GET /api/auth/portals").length).toBeGreaterThan(0);
  });

  it("garde les routes d'authentification montees", async () => {
    renderAppAt("/login", adminConfig);
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });

  it("redirige toujours une route inconnue vers /login", async () => {
    renderAppAt("/nimporte-quoi", adminConfig);
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });
});

describe("AC3 - sans l'option ou avec admin: false, aucune route admin n'est montee", () => {
  const configs: [string, AuthPortalConfig][] = [
    ["sans option", TEST_CONFIG],
    ["admin: false", { ...TEST_CONFIG, admin: false }],
  ];

  describe.each(configs)("%s", (_, config) => {
    it.each(ADMIN_PATHS)("%s redirige vers /login comme une route inconnue", async (path) => {
      const api = renderAppAt(path, config);
      expect(await findHeading("Connexion")).toBeInTheDocument();
      expect(currentLocation()).toBe("/login");
      expect(adminCallsOf(api)).toEqual([]);
    });

    it.each(ADMIN_PATHS)(
      "%s ne monte pas la page admin pour un administrateur connecte",
      async (path) => {
        const unknownRoute = await settledLocationOf("/nimporte-quoi", config, signedInAdmin);
        const api = renderAppAt(path, config, signedInAdmin);
        await waitFor(() => expect(currentLocation()).toBe(unknownRoute));
        expect(await findHeading("Connexion")).toBeInTheDocument();
        expect(adminCallsOf(api)).toEqual([]);
        expect(screen.queryByText("Alice")).not.toBeInTheDocument();
        expect(screen.queryAllByRole("button", { name: /^Ajouter un sous-rôle à / })).toHaveLength(
          0,
        );
      },
    );

    it("garde la page de connexion accessible", async () => {
      renderAppAt("/login", config);
      expect(await findHeading("Connexion")).toBeInTheDocument();
    });
  });
});

describe("AC4 - l'option admin est validee au demarrage", () => {
  it.each([
    ["null", null],
    ["chaine true", "true"],
    ["chaine false", "false"],
    ["nombre 1", 1],
    ["nombre 0", 0],
    ["objet", {}],
    ["objet non vide", { enabled: true }],
    ["liste", []],
  ])("refuse admin %s avec une AuthPortalConfigError explicite", (_, admin) => {
    const error = startupErrorOf({ ...TEST_CONFIG, admin });
    expect(error).toBeInstanceOf(AuthPortalConfigError);
    expect((error as Error).name).toBe("AuthPortalConfigError");
    expect((error as Error).message.startsWith(ERROR_PREFIX)).toBe(true);
    expect((error as Error).message).toMatch(/admin/);
  });

  it.each([
    ["true", { ...TEST_CONFIG, admin: true }],
    ["false", { ...TEST_CONFIG, admin: false }],
    ["absent", TEST_CONFIG],
  ])("accepte admin %s", (_, config) => {
    expect(startupErrorOf(config)).toBeNull();
  });

  it("leve l'erreur des l'appel de createAuthApp, avant tout rendu", () => {
    const api = stubAuthApi();
    expect(() =>
      createAuthApp({ ...TEST_CONFIG, admin: "true" } as unknown as AuthPortalConfig),
    ).toThrow(AuthPortalConfigError);
    expect(api.calls).toEqual([]);
  });
});

describe("SEC-176-02 - une valeur de config non affichable leve toujours une AuthPortalConfigError", () => {
  const withTerms = (terms: object) => ({
    ...TEST_CONFIG,
    terms: { ...TEST_CONFIG.terms, ...terms },
  });

  const configWith = (field: string, value: unknown) => {
    switch (field) {
      case "branding.animatedShapes":
        return { ...TEST_CONFIG, branding: { animatedShapes: value } };
      case "terms.effectiveDate":
        return withTerms({ effectiveDate: value });
      default:
        return { ...TEST_CONFIG, [field]: value };
    }
  };

  const expectConfigErrorMessage = (config: unknown) => {
    const error = startupErrorOf(config);
    expect(error).toBeInstanceOf(AuthPortalConfigError);
    expect(error).not.toBeInstanceOf(TypeError);
    const message = (error as Error).message;
    expect(message.startsWith(ERROR_PREFIX)).toBe(true);
    return message;
  };

  it.each([
    "admin",
    "branding.animatedShapes",
    "apiBasePath",
    "adminApiBasePath",
    "terms.effectiveDate",
    "defaultLocale",
  ])("refuse un objet sans prototype dans %s en l'affichant [object Object]", (field) => {
    const message = expectConfigErrorMessage(configWith(field, Object.create(null)));
    expect(message).toContain(field);
    expect(message).toContain('"[object Object]"');
  });

  it.each([
    [
      "dont toString leve une exception",
      {
        toString() {
          throw new Error("boom");
        },
      },
    ],
    ["dont toString renvoie un objet", { toString: () => ({}) }],
  ])("refuse un objet %s en l'affichant [object Object]", (_, value) => {
    for (const field of ["admin", "apiBasePath"]) {
      const message = expectConfigErrorMessage(configWith(field, value));
      expect(message).toContain(field);
      expect(message).toContain('"[object Object]"');
    }
  });

  it("refuse un Proxy revoque dans admin en le signalant non affichable", () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();
    const message = expectConfigErrorMessage({ ...TEST_CONFIG, admin: proxy });
    expect(message).toContain("admin");
    expect(message).toContain("[valeur non affichable]");
  });

  it.each([
    [
      "admin chaine true",
      { ...TEST_CONFIG, admin: "true" },
      `admin doit etre un booleen s'il est fourni : "true"`,
    ],
    [
      "apiBasePath nombre",
      { ...TEST_CONFIG, apiBasePath: 42 },
      `apiBasePath doit etre un chemin relatif commencant par un seul "/" : "42"`,
    ],
    [
      "apiBasePath symbole",
      { ...TEST_CONFIG, apiBasePath: Symbol("x") },
      `apiBasePath doit etre un chemin relatif commencant par un seul "/" : "Symbol(x)"`,
    ],
    [
      "admin symbole",
      { ...TEST_CONFIG, admin: Symbol("x") },
      `admin doit etre un booleen s'il est fourni : "Symbol(x)"`,
    ],
    [
      "terms.effectiveDate impossible",
      withTerms({ effectiveDate: "2026-13-45" }),
      `terms.effectiveDate doit etre une date AAAA-MM-JJ valide : "2026-13-45"`,
    ],
    [
      "defaultLocale inconnue",
      { ...TEST_CONFIG, defaultLocale: "xx" },
      `defaultLocale doit valoir fr, en : "xx"`,
    ],
  ])("garde le format de message pour %s", (_, config, reason) => {
    expect(expectConfigErrorMessage(config)).toBe(`${ERROR_PREFIX}${reason}`);
  });
});
