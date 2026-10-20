import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileDetails } from "../index";
import {
  currentLocation,
  findHeading,
  renderPortalAt,
  setupUser,
  stubAuthApi,
  TEST_ME,
  TestProviders,
  type ApiRoutes,
} from "./authPortalTestKit";

const ME = "GET /api/auth/me";
const LOGOUT = "POST /api/auth/logout";

function renderPage(routes: ApiRoutes) {
  const stub = stubAuthApi(routes);
  renderPortalAt("/account");
  return stub;
}

async function signOut() {
  const user = setupUser();
  await user.click(await screen.findByRole("button", { name: /se déconnecter/i }));
}

describe("page Account", () => {
  it("affiche le profil retourne par GET /me", async () => {
    renderPage({ [ME]: { status: 200, body: TEST_ME } });
    expect(await screen.findByText(TEST_ME.email)).toBeInTheDocument();
    expect(screen.getByText(TEST_ME.name)).toBeInTheDocument();
    expect(screen.getByText("lecteur")).toBeInTheDocument();
    expect(screen.getByText("01/06/2026")).toBeInTheDocument();
    expect(await findHeading("Mon compte")).toBeInTheDocument();
  });

  it("affiche un chargement tant que le profil n'est pas recu", async () => {
    renderPage({ [ME]: () => new Response(new ReadableStream(), { status: 200 }) });
    expect(await screen.findByLabelText("Chargement")).toBeInTheDocument();
  });

  it("affiche un placeholder en italique si aucun role", async () => {
    renderPage({ [ME]: { status: 200, body: { ...TEST_ME, roles: [] } } });
    const placeholder = await screen.findByText("Aucun rôle attribué");
    expect(placeholder.tagName).toBe("EM");
  });

  it("affiche chaque role du profil", async () => {
    renderPage({ [ME]: { status: 200, body: { ...TEST_ME, roles: ["admin", "lecteur"] } } });
    expect(await screen.findByText("admin")).toBeInTheDocument();
    expect(screen.getByText("lecteur")).toBeInTheDocument();
  });

  it("redirige vers /login?redirect=/account sur 401", async () => {
    renderPage({ [ME]: { status: 401, body: { error: "unauthorized" } } });
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    expect(new URLSearchParams(window.location.search).get("redirect")).toBe("/account");
  });

  it("affiche une erreur sur un echec non-401", async () => {
    renderPage({ [ME]: { status: 500, body: { error: "boom" } } });
    expect(await screen.findByText("Impossible de charger le profil.")).toBeInTheDocument();
    expect(currentLocation()).toBe("/account");
  });

  it("se deconnecte puis revient sur /login", async () => {
    const stub = renderPage({
      [ME]: { status: 200, body: TEST_ME },
      [LOGOUT]: { status: 204 },
    });
    await signOut();
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
    expect(stub.callsTo(LOGOUT)).toHaveLength(1);
  });

  it("affiche le bouton de deconnexion en variante accent", async () => {
    renderPage({ [ME]: { status: 200, body: TEST_ME } });
    const button = await screen.findByRole("button", { name: /se déconnecter/i });
    expect(button.className).toContain("colorAccent");
  });

  it("revient sur /login meme si POST /logout echoue", async () => {
    renderPage({
      [ME]: { status: 200, body: TEST_ME },
      [LOGOUT]: { status: 500, body: { error: "boom" } },
    });
    await signOut();
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });
});

describe("ProfileDetails", () => {
  it("presente nom, email, roles et date de creation avec leurs libelles", () => {
    render(
      <TestProviders>
        <ProfileDetails me={TEST_ME} />
      </TestProviders>,
    );
    const nameLabel = screen.getByText("Nom");
    const list = nameLabel.closest("dl") as HTMLElement;
    expect(list).not.toBeNull();
    expect(within(list).getByText("Email")).toBeInTheDocument();
    expect(within(list).getByText("Rôles")).toBeInTheDocument();
    expect(within(list).getByText("Compte créé le")).toBeInTheDocument();
    expect(within(list).getByText(TEST_ME.email)).toBeInTheDocument();
    expect(within(list).getByText("01/06/2026")).toBeInTheDocument();
  });

  it("rend l'absence de role comme un texte en emphase", () => {
    render(
      <TestProviders>
        <ProfileDetails me={{ ...TEST_ME, roles: [] }} />
      </TestProviders>,
    );
    expect(screen.getByText("Aucun rôle attribué").tagName).toBe("EM");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
