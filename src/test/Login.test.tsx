import { navigateTo } from "@canop/ui";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  currentLocation,
  findHeading,
  renderPortalAt,
  enterText,
  setupUser,
  stubAuthApi,
  type ApiStub,
} from "./authPortalTestKit";

vi.mock("@canop/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@canop/ui")>()),
  navigateTo: vi.fn(),
}));

const LOGIN = "POST /api/auth/login";

async function fillAndSubmit() {
  const user = setupUser();
  await enterText(user, await screen.findByLabelText(/email/i), "a@b.test");
  await enterText(user, screen.getByLabelText(/mot de passe/i), "secret123");
  await user.click(screen.getByRole("button", { name: /se connecter/i }));
}

function loginRejectedWith(status: number, error: string): ApiStub {
  return stubAuthApi({ [LOGIN]: { status, body: { error } } });
}

beforeEach(() => {
  vi.mocked(navigateTo).mockReset();
});

describe("page Login", () => {
  it("connecte avec email et mot de passe puis redirige vers /account", async () => {
    const stub = stubAuthApi({ [LOGIN]: { status: 200, body: {} } });
    renderPortalAt("/login");
    await fillAndSubmit();
    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith("/account"));
    expect(stub.callsTo(LOGIN)[0].body).toEqual({ email: "a@b.test", password: "secret123" });
  });

  it("affiche un message generique sur 401", async () => {
    loginRejectedWith(401, "invalid_credentials");
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
    expect(navigateTo).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeEnabled();
  });

  it("affiche le message generique sur une erreur sans code", async () => {
    stubAuthApi({ [LOGIN]: new Response("boom", { status: 500 }) });
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
  });

  it("affiche le message generique sur une erreur reseau", async () => {
    stubAuthApi({
      [LOGIN]: () => {
        throw new TypeError("Failed to fetch");
      },
    });
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
  });

  it("redirige vers la page d'attente quand le compte n'est pas encore valide", async () => {
    loginRejectedWith(403, "account_pending");
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(await findHeading("Compte en attente")).toBeInTheDocument();
    expect(currentLocation()).toBe("/pending");
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("affiche un message dedie quand le compte est desactive", async () => {
    loginRejectedWith(403, "account_disabled");
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(
      await screen.findByText("Ce compte a été désactivé. Contactez un administrateur."),
    ).toBeInTheDocument();
  });

  it("affiche un message dedie quand l'appareil n'est pas autorise", async () => {
    loginRejectedWith(403, "device_not_allowed");
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(
      await screen.findByText("Vous n'êtes pas autorisé à vous connecter avec cet appareil."),
    ).toBeInTheDocument();
  });

  it("affiche le message generique pour un code d'erreur inconnu", async () => {
    loginRejectedWith(403, "code_inconnu");
    renderPortalAt("/login");
    await fillAndSubmit();
    expect(await screen.findByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
  });

  it("affiche le bouton de connexion en variante accent", async () => {
    stubAuthApi();
    renderPortalAt("/login");
    expect((await screen.findByRole("button", { name: /se connecter/i })).className).toContain(
      "colorAccent",
    );
  });

  it("propose les liens inscription et mot de passe oublie", async () => {
    stubAuthApi();
    renderPortalAt("/login");
    expect(await screen.findByRole("link", { name: /mot de passe oublié/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByRole("link", { name: /créer un compte/i })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("n'appelle pas l'API sans email ni mot de passe", async () => {
    const stub = stubAuthApi();
    renderPortalAt("/login");
    const user = setupUser();
    await user.click(await screen.findByRole("button", { name: /se connecter/i }));
    expect(stub.callsTo(LOGIN)).toHaveLength(0);
  });
});
