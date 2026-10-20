import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  currentLocation,
  findHeading,
  renderPortalAt,
  enterText,
  setupUser,
  STRONG_PASSWORD,
  stubAuthApi,
  type ApiRoutes,
} from "./authPortalTestKit";

const RESET = "POST /api/auth/password/reset";

function renderPage(url: string, routes: ApiRoutes = {}) {
  const stub = stubAuthApi(routes);
  renderPortalAt(url);
  return stub;
}

async function fill(password: string, confirm = password) {
  const user = setupUser();
  await enterText(user, await screen.findByLabelText(/nouveau mot de passe/i), password);
  await enterText(user, screen.getByLabelText(/^confirmation/i), confirm);
  await user.click(screen.getByRole("button", { name: /définir le mot de passe/i }));
}

describe("page ResetPassword", () => {
  it("sans token : message d'erreur et lien vers une nouvelle demande", async () => {
    renderPage("/reset-password");
    expect(await screen.findByText(/token manquant/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nouvelle demande/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(
      screen.queryByRole("button", { name: /définir le mot de passe/i }),
    ).not.toBeInTheDocument();
  });

  it("avec un token vide : meme traitement que sans token", async () => {
    renderPage("/reset-password?token=");
    expect(await screen.findByText(/token manquant/i)).toBeInTheDocument();
  });

  it("reinitialise avec {token, new_password} puis redirige vers /login", async () => {
    const stub = renderPage("/reset-password?token=tok-123", { [RESET]: { status: 200 } });
    await fill(STRONG_PASSWORD);
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
    expect(stub.callsTo(RESET)[0].body).toEqual({
      token: "tok-123",
      new_password: STRONG_PASSWORD,
    });
  });

  it("bloque si les mots de passe different (sans appel API)", async () => {
    const stub = renderPage("/reset-password?token=tok-123");
    await fill(STRONG_PASSWORD, "Autre123!");
    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
    expect(stub.callsTo(RESET)).toHaveLength(0);
  });

  it("bloque un mot de passe trop court (sans appel API)", async () => {
    const stub = renderPage("/reset-password?token=tok-123");
    await fill("Ab1!");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/8/));
    expect(stub.callsTo(RESET)).toHaveLength(0);
  });

  it("message generique si le token est invalide ou expire (400)", async () => {
    renderPage("/reset-password?token=perime", {
      [RESET]: { status: 400, body: { error: "bad token" } },
    });
    await fill(STRONG_PASSWORD);
    expect(
      await screen.findByText("Le lien est invalide ou expiré. Refaites une demande."),
    ).toBeInTheDocument();
    expect(currentLocation()).toBe("/reset-password?token=perime");
  });

  it("propose le retour vers /login quand le token est present", async () => {
    renderPage("/reset-password?token=tok-123");
    expect(await screen.findByRole("link", { name: /retour à la connexion/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
