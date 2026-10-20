import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_PORTAL_PATHS,
  PortalsPage,
  RolesPage,
  UsersPage,
  type AdminPortal,
  type AdminUser,
  type AuthPortalConfig,
} from "../index";
import {
  renderPortalAt,
  setupUser,
  stubAuthApi,
  TEST_CONFIG,
  TEST_ME,
  TestProviders,
  type ApiRoutes,
} from "./authPortalTestKit";

const PORTALS = "GET /api/auth/portals";
const ROLES = "GET /api/auth/roles";
const USERS = "GET /api/auth/users?limit=100";
const STATUS = "PUT /api/auth/users/u-alice/status";
const DELETE_USER = "DELETE /api/auth/users/u-alice";
const SERVER_ERROR = { status: 500, body: { error: "internal_error" } };
const FAILURE_MESSAGE = /erreur|échou|impossible|réessay/i;
const LAST_ADMIN_MESSAGE = /au moins un administrateur/i;
const SELF_MODIFICATION_MESSAGE = /propre compte/i;

const portal = (name: string): AdminPortal => ({ name, audience: `aud-${name}`, open: false });

const FOUR_PORTALS = ["authenticator", "admin", "books", "relay"].map(portal);
const FIVE_PORTALS = [...FOUR_PORTALS, portal("garden")];

const ALICE: AdminUser = {
  user_id: "u-alice",
  name: "Alice",
  email: "alice@example.test",
  roles: ["books"],
  status: "active",
  whitelist_only: false,
  devices: [],
  created_at: "2026-01-01T00:00:00Z",
};

const healthyRoutes = (portals: AdminPortal[] = FOUR_PORTALS): ApiRoutes => ({
  [PORTALS]: { status: 200, body: portals },
  [ROLES]: { status: 200, body: [] },
  [USERS]: { status: 200, body: { users: [ALICE], page: 1, limit: 100, total: 1 } },
});

const gardenLabelConfig: AuthPortalConfig = {
  ...TEST_CONFIG,
  messages: { fr: { "auth.admin.portal.garden": "Jardin partagé" } },
};

const networkFailure = () => {
  throw new TypeError("Failed to fetch");
};

function renderAdminPage(
  Page: ComponentType,
  url: string,
  routes: ApiRoutes,
  config: AuthPortalConfig = TEST_CONFIG,
) {
  const stub = stubAuthApi(routes);
  render(
    <TestProviders config={config} url={url}>
      <Page />
    </TestProviders>,
  );
  return stub;
}

async function roleCardOrder(): Promise<string[]> {
  const buttons = await screen.findAllByRole("button", { name: /^Ajouter un sous-rôle à / });
  return buttons.map((button) =>
    (button.getAttribute("aria-label") ?? "").replace(/^Ajouter un sous-rôle à /, ""),
  );
}

function positionsInPage(labels: string[]): number[] {
  const text = document.body.textContent ?? "";
  return labels.map((label) => text.indexOf(label));
}

async function openAliceEditor() {
  const user = setupUser();
  await user.click(await screen.findByRole("button", { name: "Éditer" }));
  return { user, panel: await screen.findByRole("dialog") };
}

async function toggleAliceStatus() {
  const user = setupUser();
  await user.click(await screen.findByRole("switch", { name: "Désactiver Alice" }));
}

async function deleteAliceConfirmed() {
  const { user } = await openAliceEditor();
  await user.click(screen.getByRole("button", { name: "Supprimer" }));
  await user.click(await screen.findByRole("button", { name: "Confirmer" }));
}

async function findAlertText(): Promise<string> {
  let text = "";
  await waitFor(() => {
    text = screen
      .getAllByRole("alert")
      .map((alert) => alert.textContent ?? "")
      .join(" ");
    expect(text.trim()).not.toBe("");
  });
  return text;
}

async function findAlertMatching(message: RegExp): Promise<HTMLElement> {
  let match: HTMLElement | undefined;
  await waitFor(() => {
    match = screen.getAllByRole("alert").find((alert) => message.test(alert.textContent ?? ""));
    expect(match).toBeDefined();
  });
  return match as HTMLElement;
}

function alertsContaining(message: RegExp, hidden: boolean): HTMLElement[] {
  return screen
    .queryAllByRole("alert", { hidden })
    .filter((alert) => message.test(alert.textContent ?? ""));
}

async function expectSingleAnnouncement(message: RegExp) {
  await findAlertMatching(message);
  expect(alertsContaining(message, false)).toHaveLength(1);
  expect(alertsContaining(message, true)).toHaveLength(1);
}

async function saveAliceRenamed() {
  const { user, panel } = await openAliceEditor();
  const name = within(panel).getByLabelText(/^Nom/);
  await user.clear(name);
  await user.type(name, "Alicia");
  await user.click(within(panel).getByRole("button", { name: "Enregistrer" }));
}

async function saveAliceWithoutBooksAccess() {
  const { user, panel } = await openAliceEditor();
  await user.click(within(panel).getByRole("switch", { name: "Accès au portail books" }));
  await user.click(within(panel).getByRole("button", { name: "Enregistrer" }));
}

function rejectAllFetches() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => networkFailure()),
  );
}

describe("AC1 - la page /roles affiche une carte par portail dans l'ordre de l'API", () => {
  it("expose les routes admin /users, /roles et /portals", () => {
    expect(ADMIN_PORTAL_PATHS).toEqual({ users: "/users", roles: "/roles", portals: "/portals" });
  });

  it("affiche 4 cartes dans l'ordre renvoye par GET /portals", async () => {
    const stub = renderAdminPage(RolesPage, "/roles", healthyRoutes());
    expect(await roleCardOrder()).toEqual(["authenticator", "admin", "books", "relay"]);
    expect(stub.callsTo(PORTALS).length).toBeGreaterThan(0);
  });

  it("respecte l'ordre inverse renvoye par l'API", async () => {
    renderAdminPage(RolesPage, "/roles", healthyRoutes([...FOUR_PORTALS].reverse()));
    expect(await roleCardOrder()).toEqual(["relay", "books", "admin", "authenticator"]);
  });

  it("respecte un ordre melange renvoye par l'API", async () => {
    const shuffled = ["books", "authenticator", "relay", "admin"].map(portal);
    renderAdminPage(RolesPage, "/roles", healthyRoutes(shuffled));
    expect(await roleCardOrder()).toEqual(["books", "authenticator", "relay", "admin"]);
  });

  it("n'affiche aucune carte quand l'API ne renvoie aucun portail", async () => {
    const stub = renderAdminPage(RolesPage, "/roles", healthyRoutes([]));
    await waitFor(() => expect(stub.callsTo(PORTALS).length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    expect(screen.queryAllByRole("button", { name: /^Ajouter un sous-rôle à / })).toHaveLength(0);
  });

  it("est accessible via la route /roles du portail", async () => {
    stubAuthApi({
      ...healthyRoutes(),
      "GET /api/auth/me": { status: 200, body: { ...TEST_ME, roles: ["admin"] } },
    });
    renderPortalAt(ADMIN_PORTAL_PATHS.roles, { config: { ...TEST_CONFIG, admin: true } });
    expect(await roleCardOrder()).toEqual(["authenticator", "admin", "books", "relay"]);
  });
});

describe("AC2 - un portail supplementaire de l'API apparait sans changer le paquet", () => {
  it("affiche le 5e portail sur /roles avec son nom technique sans libelle", async () => {
    renderAdminPage(RolesPage, "/roles", healthyRoutes(FIVE_PORTALS));
    expect(await roleCardOrder()).toEqual(["authenticator", "admin", "books", "relay", "garden"]);
  });

  it("affiche le 5e portail sur /roles avec le libelle de config.messages", async () => {
    renderAdminPage(RolesPage, "/roles", healthyRoutes(FIVE_PORTALS), gardenLabelConfig);
    expect(await roleCardOrder()).toEqual([
      "authenticator",
      "admin",
      "books",
      "relay",
      "Jardin partagé",
    ]);
  });

  it("affiche le 5e portail sur /portals avec son nom technique sans libelle", async () => {
    renderAdminPage(PortalsPage, "/portals", healthyRoutes(FIVE_PORTALS));
    expect(await screen.findAllByText("garden")).not.toHaveLength(0);
    const positions = positionsInPage(["authenticator", "relay", "garden"]);
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("affiche le 5e portail sur /portals avec le libelle de config.messages", async () => {
    renderAdminPage(PortalsPage, "/portals", healthyRoutes(FIVE_PORTALS), gardenLabelConfig);
    expect(await screen.findAllByText("Jardin partagé")).not.toHaveLength(0);
  });

  it("affiche le 5e portail dans l'edition d'un utilisateur avec son nom technique", async () => {
    renderAdminPage(UsersPage, "/users", healthyRoutes(FIVE_PORTALS));
    const { panel } = await openAliceEditor();
    expect(
      await within(panel).findByRole("switch", { name: "Accès au portail garden" }),
    ).toBeInTheDocument();
    expect(within(panel).getAllByText("garden")).not.toHaveLength(0);
  });

  it("affiche le 5e portail dans l'edition d'un utilisateur avec le libelle de config.messages", async () => {
    renderAdminPage(UsersPage, "/users", healthyRoutes(FIVE_PORTALS), gardenLabelConfig);
    const { panel } = await openAliceEditor();
    expect(
      await within(panel).findByRole("switch", { name: "Accès au portail Jardin partagé" }),
    ).toBeInTheDocument();
    expect(within(panel).getAllByText("Jardin partagé")).not.toHaveLength(0);
  });

  it("applique un libelle a un portail existant sans toucher aux autres", async () => {
    const config = {
      ...TEST_CONFIG,
      messages: { fr: { "auth.admin.portal.books": "Bibliothèque" } },
    };
    renderAdminPage(RolesPage, "/roles", healthyRoutes(), config);
    expect(await roleCardOrder()).toEqual(["authenticator", "admin", "Bibliothèque", "relay"]);
  });
});

describe("AC3 - une erreur API est affichee a l'utilisateur", () => {
  const pages: Array<[string, ComponentType, string]> = [
    ["/roles", RolesPage, PORTALS],
    ["/portals", PortalsPage, PORTALS],
    ["/users", UsersPage, USERS],
  ];

  it.each(pages)(
    "affiche une erreur sur %s quand le chargement repond 500",
    async (url, Page, key) => {
      renderAdminPage(Page, url, { ...healthyRoutes(), [key]: SERVER_ERROR });
      expect(await findAlertText()).toMatch(FAILURE_MESSAGE);
    },
  );

  it.each(pages)(
    "affiche une erreur sur %s quand le reseau echoue au chargement",
    async (url, Page) => {
      rejectAllFetches();
      render(
        <TestProviders url={url}>
          <Page />
        </TestProviders>,
      );
      expect(await findAlertText()).toMatch(FAILURE_MESSAGE);
    },
  );

  it("affiche une erreur quand le changement de statut repond 500", async () => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [STATUS]: SERVER_ERROR });
    await toggleAliceStatus();
    expect(await screen.findByText(FAILURE_MESSAGE)).toBeVisible();
  });

  it("affiche une erreur quand le changement de statut echoue cote reseau", async () => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [STATUS]: networkFailure });
    await toggleAliceStatus();
    expect(await screen.findByText(FAILURE_MESSAGE)).toBeVisible();
  });

  it("affiche une erreur quand la suppression repond 500", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [DELETE_USER]: SERVER_ERROR,
    });
    await deleteAliceConfirmed();
    await waitFor(() => expect(stub.callsTo(DELETE_USER)).toHaveLength(1));
    expect(await screen.findByText(FAILURE_MESSAGE)).toBeVisible();
  });

  it("affiche une erreur quand la suppression echoue cote reseau", async () => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [DELETE_USER]: networkFailure });
    await deleteAliceConfirmed();
    expect(await screen.findByText(FAILURE_MESSAGE)).toBeVisible();
  });
});

describe("AC3 - les erreurs d'action sont annoncees et jamais brutes", () => {
  const TECHNICAL_ERROR = { status: 500, body: { error: "technical_failure_xyz" } };

  it.each<[string, ApiRoutes, () => Promise<void>, RegExp]>([
    ["un statut en 500", { [STATUS]: SERVER_ERROR }, toggleAliceStatus, FAILURE_MESSAGE],
    ["un statut en echec reseau", { [STATUS]: networkFailure }, toggleAliceStatus, FAILURE_MESSAGE],
    [
      "une suppression en 500",
      { [DELETE_USER]: SERVER_ERROR },
      deleteAliceConfirmed,
      FAILURE_MESSAGE,
    ],
    [
      "un refus last_admin",
      { [STATUS]: { status: 409, body: { error: "last_admin" } } },
      toggleAliceStatus,
      LAST_ADMIN_MESSAGE,
    ],
    [
      "un refus self_modification",
      { [DELETE_USER]: { status: 409, body: { error: "self_modification" } } },
      deleteAliceConfirmed,
      SELF_MODIFICATION_MESSAGE,
    ],
  ])("annonce %s dans un element role alert", async (_, routes, act, message) => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), ...routes });
    await act();
    expect(await findAlertMatching(message)).toBeVisible();
  });

  it("affiche le message generique et non le code brut pour un 500 technique sur une action", async () => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [STATUS]: TECHNICAL_ERROR });
    await toggleAliceStatus();
    await findAlertMatching(FAILURE_MESSAGE);
    expect(document.body.textContent).not.toContain("technical_failure_xyz");
  });

  it.each<[string, ComponentType, string]>([
    ["/roles", RolesPage, PORTALS],
    ["/portals", PortalsPage, PORTALS],
    ["/users", UsersPage, USERS],
  ])(
    "affiche le message generique et non le code brut pour un 500 technique au chargement de %s",
    async (url, Page, key) => {
      renderAdminPage(Page, url, { ...healthyRoutes(), [key]: TECHNICAL_ERROR });
      await findAlertMatching(FAILURE_MESSAGE);
      expect(document.body.textContent).not.toContain("technical_failure_xyz");
    },
  );

  it("affiche le message generique pour un code de forme libelle comme Erreur 500", async () => {
    renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [STATUS]: { status: 500, body: { error: "Erreur 500" } },
    });
    await toggleAliceStatus();
    await findAlertMatching(FAILURE_MESSAGE);
    expect(document.body.textContent).not.toContain("Erreur 500");
  });
});

describe("AC3 - annonce unique et exposee des erreurs, panneau ouvert ou ferme", () => {
  const UPDATE_USER = "PUT /api/auth/users/u-alice";
  const UPDATE_ROLES = "PUT /api/auth/users/u-alice/roles";
  const SUB_ROLE = {
    id: "r-sub",
    name: "books-editor",
    portal: "books",
    kind: "sub",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("annonce une seule fois l'echec d'une suppression depuis le panneau", async () => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [DELETE_USER]: SERVER_ERROR });
    await deleteAliceConfirmed();
    await expectSingleAnnouncement(FAILURE_MESSAGE);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("annonce une seule fois un refus self_modification depuis le panneau", async () => {
    renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [DELETE_USER]: { status: 409, body: { error: "self_modification" } },
    });
    await deleteAliceConfirmed();
    await expectSingleAnnouncement(SELF_MODIFICATION_MESSAGE);
  });

  it("annonce l'echec de l'enregistrement de l'identite depuis le panneau", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [UPDATE_USER]: SERVER_ERROR,
    });
    await saveAliceRenamed();
    await waitFor(() => expect(stub.callsTo(UPDATE_USER)).toHaveLength(1));
    await expectSingleAnnouncement(FAILURE_MESSAGE);
  });

  it("annonce l'echec de l'enregistrement des roles depuis le panneau", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [UPDATE_USER]: { status: 200, body: ALICE },
      [UPDATE_ROLES]: SERVER_ERROR,
    });
    await saveAliceWithoutBooksAccess();
    await waitFor(() => expect(stub.callsTo(UPDATE_ROLES)).toHaveLength(1));
    await expectSingleAnnouncement(FAILURE_MESSAGE);
  });

  it("annonce une seule fois l'echec d'une action depuis le tableau panneau ferme", async () => {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [STATUS]: SERVER_ERROR });
    await toggleAliceStatus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await expectSingleAnnouncement(FAILURE_MESSAGE);
  });

  it("annonce un refus last_admin depuis le tableau panneau ferme", async () => {
    renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [STATUS]: { status: 409, body: { error: "last_admin" } },
    });
    await toggleAliceStatus();
    await expectSingleAnnouncement(LAST_ADMIN_MESSAGE);
  });

  it("annonce l'echec de suppression d'un sous-role sur la page Roles", async () => {
    const deleteRole = "DELETE /api/auth/roles/r-sub";
    const stub = renderAdminPage(RolesPage, "/roles", {
      ...healthyRoutes(),
      [ROLES]: { status: 200, body: [SUB_ROLE] },
      [deleteRole]: SERVER_ERROR,
    });
    const user = setupUser();
    await user.click(
      await screen.findByRole("button", { name: "Supprimer le sous-rôle books-editor" }),
    );
    await user.click(await screen.findByRole("button", { name: "Confirmer" }));
    await waitFor(() => expect(stub.callsTo(deleteRole)).toHaveLength(1));
    await expectSingleAnnouncement(FAILURE_MESSAGE);
  });
});

describe("enregistrement d'un utilisateur - appels et rechargement", () => {
  const UPDATE_USER = "PUT /api/auth/users/u-alice";
  const UPDATE_ROLES = "PUT /api/auth/users/u-alice/roles";
  const RENAMED = { ...ALICE, name: "Alicia" };

  const userReloads = (stub: ReturnType<typeof stubAuthApi>) =>
    stub.calls.filter((call) => call.method === "GET" && call.url.startsWith("/api/auth/users"));

  const settle = () => new Promise((resolve) => setTimeout(resolve, 500));

  async function saveAliceRenamedWithoutBooksAccess() {
    const { user, panel } = await openAliceEditor();
    const name = within(panel).getByLabelText(/^Nom/);
    await user.clear(name);
    await user.type(name, "Alicia");
    await user.click(within(panel).getByRole("switch", { name: "Accès au portail books" }));
    await user.click(within(panel).getByRole("button", { name: "Enregistrer" }));
  }

  it("n'envoie aucun PUT des roles quand les roles sont inchanges", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [UPDATE_USER]: { status: 200, body: RENAMED },
      [UPDATE_ROLES]: { status: 200, body: RENAMED },
    });
    await saveAliceRenamed();
    await waitFor(() => expect(stub.callsTo(UPDATE_USER)).toHaveLength(1));
    await settle();
    expect(stub.callsTo(UPDATE_ROLES)).toHaveLength(0);
  });

  it("envoie le PUT des roles quand les roles changent", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [UPDATE_USER]: { status: 200, body: ALICE },
      [UPDATE_ROLES]: { status: 200, body: { ...ALICE, roles: [] } },
    });
    await saveAliceWithoutBooksAccess();
    await waitFor(() => expect(stub.callsTo(UPDATE_ROLES)).toHaveLength(1));
    expect(stub.callsTo(UPDATE_ROLES)[0].body).toEqual({ roles: [] });
  });

  it("ne recharge la liste qu'une seule fois apres un enregistrement nom et roles", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [UPDATE_USER]: { status: 200, body: RENAMED },
      [UPDATE_ROLES]: { status: 200, body: { ...RENAMED, roles: [] } },
    });
    await screen.findByText("Alice");
    expect(userReloads(stub)).toHaveLength(1);
    await saveAliceRenamedWithoutBooksAccess();
    await waitFor(() => expect(stub.callsTo(UPDATE_ROLES)).toHaveLength(1));
    expect(stub.callsTo(UPDATE_USER)).toHaveLength(1);
    await waitFor(() => expect(userReloads(stub)).toHaveLength(2));
    await settle();
    expect(userReloads(stub)).toHaveLength(2);
  });

  it("annonce l'echec du PUT des roles et recharge quand meme la liste", async () => {
    const stub = renderAdminPage(UsersPage, "/users", {
      ...healthyRoutes(),
      [UPDATE_USER]: { status: 200, body: RENAMED },
      [UPDATE_ROLES]: SERVER_ERROR,
    });
    await screen.findByText("Alice");
    await saveAliceRenamedWithoutBooksAccess();
    await waitFor(() => expect(stub.callsTo(UPDATE_ROLES)).toHaveLength(1));
    await expectSingleAnnouncement(FAILURE_MESSAGE);
    await waitFor(() => expect(userReloads(stub)).toHaveLength(2));
    await settle();
    expect(userReloads(stub)).toHaveLength(2);
  });
});

describe("AC4 - les refus 409 affichent un message explicite", () => {
  const refusal = (error: string) => ({ status: 409, body: { error } });

  async function refuseStatusChange(error: string) {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [STATUS]: refusal(error) });
    await toggleAliceStatus();
  }

  async function refuseDeletion(error: string) {
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [DELETE_USER]: refusal(error) });
    await deleteAliceConfirmed();
  }

  it("explique le refus last_admin sur un changement de statut", async () => {
    await refuseStatusChange("last_admin");
    expect(await screen.findByText(LAST_ADMIN_MESSAGE)).toBeVisible();
    expect(screen.queryByText(/last_admin/)).not.toBeInTheDocument();
  });

  it("explique le refus self_modification sur un changement de statut", async () => {
    await refuseStatusChange("self_modification");
    expect(await screen.findByText(SELF_MODIFICATION_MESSAGE)).toBeVisible();
    expect(screen.queryByText(/self_modification/)).not.toBeInTheDocument();
    expect(screen.queryByText(LAST_ADMIN_MESSAGE)).not.toBeInTheDocument();
  });

  it("explique le refus last_admin sur une suppression", async () => {
    await refuseDeletion("last_admin");
    expect(await screen.findByText(LAST_ADMIN_MESSAGE)).toBeVisible();
    expect(screen.queryByText(/last_admin/)).not.toBeInTheDocument();
  });

  it("explique le refus self_modification sur une suppression", async () => {
    await refuseDeletion("self_modification");
    expect(await screen.findByText(SELF_MODIFICATION_MESSAGE)).toBeVisible();
    expect(screen.queryByText(/self_modification/)).not.toBeInTheDocument();
    expect(screen.queryByText(LAST_ADMIN_MESSAGE)).not.toBeInTheDocument();
  });

  it("distingue le refus last_admin du message d'erreur generique", async () => {
    await refuseStatusChange("last_admin");
    const refusalText = (await screen.findByText(LAST_ADMIN_MESSAGE)).textContent;
    cleanup();
    renderAdminPage(UsersPage, "/users", { ...healthyRoutes(), [STATUS]: SERVER_ERROR });
    await toggleAliceStatus();
    const genericText = (await screen.findByText(FAILURE_MESSAGE)).textContent;
    expect(genericText).not.toBe(refusalText);
  });
});

const SRC = join(__dirname, "..");

function productionSources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "test" ? [] : productionSources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("AC5 - aucun import MUI direct dans src hors tests", () => {
  it("scanne les nouvelles pages admin", () => {
    const files = productionSources(SRC).map((file) => relative(SRC, file).split(sep).join("/"));
    expect(files).toEqual(
      expect.arrayContaining([
        "pages/UsersPage.tsx",
        "pages/RolesPage.tsx",
        "pages/PortalsPage.tsx",
      ]),
    );
  });

  it("ne trouve aucun import depuis @mui/", () => {
    const muiImport =
      /(from\s+["']@mui\/|import\s*\(\s*["']@mui\/|import\s+["']@mui\/|require\(\s*["']@mui\/)/;
    const offenders = productionSources(SRC).filter((file) =>
      muiImport.test(readFileSync(file, "utf-8")),
    );
    expect(offenders).toEqual([]);
  });
});
