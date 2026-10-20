import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AdminPortalApp,
  useAdminLayout,
  type AdminPortalConfig,
  type PortalLayoutProps,
} from "../index";
import {
  ADMIN_CONFIG,
  apiError,
  CGU_URL,
  currentPath,
  linksTo,
  LOGIN_TARGET,
  meWithRoles,
  renderAdminApp,
  settle,
  stubAdminBackend,
} from "./adminPortalKit";
import { captureDocumentNavigation } from "./authPortalTestKit";

const ADMIN = { "GET /api/auth/me": meWithRoles(["admin"]) };
const NON_ADMIN = { "GET /api/auth/me": meWithRoles(["lecteur"]) };
const SIGNED_OUT = { "GET /api/auth/me": apiError(401, "unauthorized") };

const DASHBOARD_HEADING = { name: "Tableau de bord" } as const;

async function expectDashboard() {
  expect(await screen.findByRole("heading", DASHBOARD_HEADING)).toBeInTheDocument();
  expect(currentPath()).toBe("/dashboard");
}

async function expectForbidden() {
  expect(await screen.findByRole("heading", { name: "Accès refusé" })).toBeInTheDocument();
  expect(currentPath()).toBe("/forbidden");
}

function AcmeAdminLayout({ children }: PortalLayoutProps) {
  const { userName } = useAdminLayout();
  return (
    <div data-testid="acme-admin-layout">
      <span data-testid="acme-admin-user">{userName}</span>
      {children}
    </div>
  );
}

describe("createAdminApp - garde de session", () => {
  it("Given /me en 401 et refresh refuse, When le portail admin s'ouvre, Then il redirige une seule fois vers la connexion du portail d'auth", async () => {
    const { navigations } = renderAdminApp(ADMIN_CONFIG, SIGNED_OUT);

    await waitFor(() => expect(navigations).toHaveLength(1));
    await settle();

    expect(navigations).toEqual([LOGIN_TARGET]);
    expect(screen.queryByRole("heading", DASHBOARD_HEADING)).not.toBeInTheDocument();
  });

  it("Given /me en 401 en StrictMode, When le portail admin s'ouvre, Then la redirection reste unique", async () => {
    const { navigations } = renderAdminApp(ADMIN_CONFIG, SIGNED_OUT, { strict: true });

    await waitFor(() => expect(navigations).toHaveLength(1));
    await settle();

    expect(navigations).toEqual([LOGIN_TARGET]);
  });

  it("Given un utilisateur connecte sans le role admin, When le portail admin s'ouvre, Then il est envoye sur /forbidden sans redirection externe", async () => {
    const { navigations } = renderAdminApp(ADMIN_CONFIG, NON_ADMIN);

    await expectForbidden();
    await settle();
    expect(navigations).toEqual([]);
  });

  it.each(["/dashboard", "/users", "/roles", "/portals"])(
    "Given un utilisateur sans le role admin, When il ouvre %s, Then il est envoye sur /forbidden",
    async (url) => {
      renderAdminApp(ADMIN_CONFIG, NON_ADMIN, { url });

      await expectForbidden();
    },
  );

  it("Given un utilisateur sans aucun role, When le portail admin s'ouvre, Then il est envoye sur /forbidden", async () => {
    renderAdminApp(ADMIN_CONFIG, { "GET /api/auth/me": meWithRoles([]) });

    await expectForbidden();
  });

  it.each(["/", "/dashboard", "/nimporte-quoi"])(
    "Given un administrateur, When il ouvre %s, Then le tableau de bord s'affiche",
    async (url) => {
      const { navigations } = renderAdminApp(ADMIN_CONFIG, ADMIN, { url });

      await expectDashboard();
      expect(await screen.findByText("Pierre Pending")).toBeInTheDocument();
      expect(navigations).toEqual([]);
    },
  );

  it("Given un administrateur, When le tableau de bord s'affiche, Then les appels admin partent sous /api/admin et /me sous /api/auth", async () => {
    const { backend } = renderAdminApp(ADMIN_CONFIG, ADMIN);

    await expectDashboard();
    await screen.findByText("Pierre Pending");

    expect(backend.requests).toContain("GET /api/auth/me");
    expect(backend.requests).toContain("GET /api/admin/users");
  });
});

describe("createAdminApp - adminRole personnalise", () => {
  const supervisorConfig: AdminPortalConfig = { ...ADMIN_CONFIG, adminRole: "superviseur" };

  it("Given adminRole superviseur, When un superviseur ouvre le portail, Then le tableau de bord s'affiche", async () => {
    renderAdminApp(supervisorConfig, { "GET /api/auth/me": meWithRoles(["superviseur"]) });

    await expectDashboard();
  });

  it("Given adminRole superviseur, When un utilisateur qui n'a que le role admin ouvre le portail, Then il est envoye sur /forbidden", async () => {
    renderAdminApp(supervisorConfig, ADMIN);

    await expectForbidden();
  });
});

describe("createAdminApp - adminLayout personnalise", () => {
  it("Given un adminLayout, When un administrateur ouvre le portail, Then le tableau de bord est rendu dans ce cadre", async () => {
    renderAdminApp({ ...ADMIN_CONFIG, adminLayout: AcmeAdminLayout }, ADMIN);

    await expectDashboard();
    const layout = screen.getByTestId("acme-admin-layout");
    expect(within(layout).getByRole("heading", DASHBOARD_HEADING)).toBeInTheDocument();
    expect(within(layout).getByTestId("acme-admin-user")).toHaveTextContent("Ada Admin");
  });

  it("Given un adminLayout, When un administrateur ouvre le portail, Then le cadre par defaut et sa navigation ne sont pas rendus", async () => {
    renderAdminApp({ ...ADMIN_CONFIG, adminLayout: AcmeAdminLayout }, ADMIN);

    await expectDashboard();
    expect(
      screen.queryByRole("navigation", { name: "Navigation d'administration" }),
    ).not.toBeInTheDocument();
    expect(linksTo(CGU_URL)).toHaveLength(0);
  });

  it("Given aucun adminLayout, When un administrateur ouvre le portail, Then le cadre par defaut est rendu", async () => {
    renderAdminApp(ADMIN_CONFIG, ADMIN);

    await expectDashboard();
    expect(screen.queryByTestId("acme-admin-layout")).not.toBeInTheDocument();
    expect(screen.getAllByText("Acme Admin").length).toBeGreaterThan(0);
  });
});

describe("createAdminApp - pied de page", () => {
  it("Given aucun branding.footer, When un administrateur ouvre le portail, Then les liens legaux pointent vers le portail d'auth", async () => {
    renderAdminApp(ADMIN_CONFIG, ADMIN);

    await expectDashboard();
    expect(linksTo(CGU_URL).length).toBeGreaterThan(0);
    expect(linksTo(`${CGU_URL}#mentions-legales`).length).toBeGreaterThan(0);
  });

  it("Given un branding.footer, When un administrateur ouvre le portail, Then il remplace les liens legaux par defaut", async () => {
    renderAdminApp(
      { ...ADMIN_CONFIG, branding: { footer: <p data-testid="acme-footer">Acme SAS</p> } },
      ADMIN,
    );

    await expectDashboard();
    expect(screen.getByTestId("acme-footer")).toHaveTextContent("Acme SAS");
    expect(linksTo(CGU_URL)).toHaveLength(0);
    expect(linksTo(`${CGU_URL}#mentions-legales`)).toHaveLength(0);
  });

  it("Given branding.footer null, When un administrateur ouvre le portail, Then aucun pied de page n'est affiche", async () => {
    renderAdminApp({ ...ADMIN_CONFIG, branding: { footer: null } }, ADMIN);

    await expectDashboard();
    expect(linksTo(CGU_URL)).toHaveLength(0);
    expect(linksTo(`${CGU_URL}#mentions-legales`)).toHaveLength(0);
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });
});

describe("AdminPortalApp - composant equivalent", () => {
  const MODULE_CONFIG: AdminPortalConfig = { ...ADMIN_CONFIG, appName: "Acme Composant" };

  function renderComponent(routes: Record<string, ReturnType<typeof meWithRoles>>) {
    stubAdminBackend(routes);
    const navigations = captureDocumentNavigation();
    render(<AdminPortalApp config={MODULE_CONFIG} />);
    return navigations;
  }

  it("Given un administrateur, When AdminPortalApp est rendu, Then le tableau de bord s'affiche", async () => {
    renderComponent(ADMIN);

    await expectDashboard();
  });

  it("Given /me en 401, When AdminPortalApp est rendu, Then il redirige une seule fois vers la connexion", async () => {
    const navigations = renderComponent(SIGNED_OUT);

    await waitFor(() => expect(navigations).toHaveLength(1));
    await settle();
    expect(navigations).toEqual([LOGIN_TARGET]);
  });

  it("Given un utilisateur sans le role admin, When AdminPortalApp est rendu, Then il est envoye sur /forbidden", async () => {
    renderComponent(NON_ADMIN);

    await expectForbidden();
  });
});

describe("createAdminApp - session perdue", () => {
  it.each(["account_disabled", "account_pending"])(
    "Given /me en 403 %s, When le portail admin s'ouvre, Then il redirige une seule fois vers la connexion",
    async (code) => {
      const { navigations } = renderAdminApp(ADMIN_CONFIG, {
        "GET /api/auth/me": apiError(403, code),
      });

      await waitFor(() => expect(navigations).toHaveLength(1));
      await settle();

      expect(navigations).toEqual([LOGIN_TARGET]);
      expect(screen.queryByRole("heading", DASHBOARD_HEADING)).not.toBeInTheDocument();
      expect(currentPath()).not.toBe("/forbidden");
    },
  );

  it.each(["account_disabled", "account_pending"])(
    "Given /me en 401 puis refresh en 403 %s, When le portail admin s'ouvre, Then il redirige une seule fois vers la connexion",
    async (code) => {
      const { backend, navigations } = renderAdminApp(ADMIN_CONFIG, {
        ...SIGNED_OUT,
        "POST /api/auth/refresh": apiError(403, code),
      });

      await waitFor(() => expect(navigations).toHaveLength(1));
      await settle();

      expect(backend.requests).toContain("POST /api/auth/refresh");
      expect(navigations).toEqual([LOGIN_TARGET]);
    },
  );

  it.each(["account_disabled", "account_pending"])(
    "Given un admin dont tous les appels du tableau de bord echouent en 403 %s, When le tableau de bord se charge, Then il ne redirige qu'une seule fois",
    async (code) => {
      const failing = apiError(403, code);
      const { backend, navigations } = renderAdminApp(
        ADMIN_CONFIG,
        {
          ...ADMIN,
          "GET /api/admin/users": failing,
          "GET /api/admin/settings/registration": failing,
          "GET /api/admin/analytics/traffic": failing,
        },
        { strict: true },
      );

      await waitFor(() => expect(navigations).toHaveLength(1));
      await settle(300);

      expect(backend.failedAdminCalls()).toBeGreaterThan(1);
      expect(navigations).toEqual([LOGIN_TARGET]);
    },
  );

  it("Given un admin dont tous les appels du tableau de bord echouent en 401 avec refresh refuse, When le tableau de bord se charge, Then il ne redirige qu'une seule fois", async () => {
    const failing = apiError(401, "unauthorized");
    const { backend, navigations } = renderAdminApp(ADMIN_CONFIG, {
      ...ADMIN,
      "GET /api/admin/users": failing,
      "GET /api/admin/settings/registration": failing,
      "GET /api/admin/analytics/traffic": failing,
    });

    await waitFor(() => expect(navigations).toHaveLength(1));
    await settle(300);

    expect(backend.failedAdminCalls()).toBeGreaterThan(1);
    expect(navigations).toEqual([LOGIN_TARGET]);
  });

  it("Given /me en 403 forbidden, When le portail admin s'ouvre, Then il ne redirige pas vers la connexion", async () => {
    const { navigations } = renderAdminApp(ADMIN_CONFIG, {
      "GET /api/auth/me": apiError(403, "forbidden"),
    });

    await settle(300);

    expect(navigations).toEqual([]);
    expect(screen.queryByRole("heading", DASHBOARD_HEADING)).not.toBeInTheDocument();
  });
});
