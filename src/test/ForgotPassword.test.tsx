import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  enterText,
  renderPortalAt,
  setupUser,
  stubAuthApi,
  type ApiRoutes,
} from "./authPortalTestKit";

const FORGOT = "POST /api/auth/password/forgot";
const MESSAGE =
  "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.";

function renderPage(routes: ApiRoutes = {}) {
  const stub = stubAuthApi(routes);
  renderPortalAt("/forgot-password");
  return stub;
}

async function submit(email = "a@b.test") {
  const user = setupUser();
  await enterText(user, await screen.findByLabelText(/email/i), email);
  await user.click(screen.getByRole("button", { name: /envoyer le lien/i }));
}

describe("page ForgotPassword", () => {
  it("envoie la demande et affiche le message de confirmation", async () => {
    const stub = renderPage({ [FORGOT]: { status: 202 } });
    await submit();
    expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
    expect(stub.callsTo(FORGOT)[0].body).toEqual({ email: "a@b.test" });
  });

  it("affiche le meme message si l'API echoue (anti-enumeration)", async () => {
    renderPage({ [FORGOT]: { status: 500, body: { error: "boom" } } });
    await submit();
    expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
  });

  it("affiche le meme message pour un email inconnu (404)", async () => {
    renderPage({ [FORGOT]: { status: 404, body: { error: "user_not_found" } } });
    await submit("inconnu@b.test");
    expect(await screen.findByText(MESSAGE)).toBeInTheDocument();
  });

  it("masque le formulaire apres envoi", async () => {
    renderPage({ [FORGOT]: { status: 202 } });
    await submit();
    await screen.findByText(MESSAGE);
    expect(screen.queryByRole("button", { name: /envoyer le lien/i })).not.toBeInTheDocument();
  });

  it("propose le retour vers /login", async () => {
    renderPage();
    expect(await screen.findByRole("link", { name: /retour à la connexion/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
