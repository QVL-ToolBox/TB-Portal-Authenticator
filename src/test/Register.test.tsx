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
  TEST_TERMS_VERSION,
  type ApiRoutes,
} from "./authPortalTestKit";

const REGISTER = "POST /api/auth/register";
const SETTINGS = "GET /api/auth/settings/registration";

function renderRegister(routes: ApiRoutes = {}) {
  const stub = stubAuthApi(routes);
  renderPortalAt("/register");
  return stub;
}

async function fill({
  name = "Camille",
  password = STRONG_PASSWORD,
  confirm = password,
}: { name?: string; password?: string; confirm?: string } = {}) {
  const user = setupUser();
  await enterText(user, await screen.findByLabelText(/^nom/i), name);
  await enterText(user, screen.getByLabelText(/^email/i), "nouveau@example.test");
  await enterText(user, screen.getByLabelText(/^mot de passe/i), password);
  await enterText(user, screen.getByLabelText(/confirmation/i), confirm);
  await user.click(screen.getByRole("checkbox", { name: /j'ai lu et j'accepte les/i }));
  await user.click(screen.getByRole("button", { name: /créer le compte/i }));
}

describe("page Register", () => {
  it("cree le compte avec la version des CGU configuree puis redirige vers /login", async () => {
    const stub = renderRegister({ [REGISTER]: { status: 201, body: {} } });
    await fill({ name: "  Camille  " });
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
    expect(stub.callsTo(REGISTER)[0].body).toEqual({
      name: "Camille",
      email: "nouveau@example.test",
      password: STRONG_PASSWORD,
      accepted_terms_version: TEST_TERMS_VERSION,
    });
  });

  it("affiche la mention CGU avec les majuscules attendues", async () => {
    renderRegister();
    await screen.findByLabelText(/^nom/i);
    expect(
      screen.getByRole("link", { name: "Conditions Générales d'Utilisation" }),
    ).toBeInTheDocument();
  });

  it("propose le retour vers la connexion pour un compte existant", async () => {
    renderRegister();
    expect(
      await screen.findByRole("link", { name: "Déjà un compte ? Se connecter" }),
    ).toHaveAttribute("href", "/login");
  });

  it("masque le formulaire quand les inscriptions sont fermees", async () => {
    renderRegister({ [SETTINGS]: { status: 200, body: { enabled: false } } });
    expect(
      await screen.findByText("Les inscriptions sont actuellement fermées."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^nom/i)).not.toBeInTheDocument();
  });

  it("affiche un chargement tant que l'etat des inscriptions n'est pas connu", async () => {
    renderRegister({ [SETTINGS]: () => new Response(new ReadableStream(), { status: 200 }) });
    expect(await screen.findByLabelText("Chargement")).toBeInTheDocument();
  });

  it("laisse le formulaire disponible si l'etat des inscriptions est indisponible", async () => {
    renderRegister({ [SETTINGS]: { status: 500, body: { error: "boom" } } });
    expect(await screen.findByLabelText(/^nom/i)).toBeInTheDocument();
  });

  it("bloque si les mots de passe different (sans appel API)", async () => {
    const stub = renderRegister();
    await fill({ password: STRONG_PASSWORD, confirm: "Autre123!" });
    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
    expect(stub.callsTo(REGISTER)).toHaveLength(0);
  });

  it("bloque un mot de passe trop court (sans appel API)", async () => {
    const stub = renderRegister();
    await fill({ password: "Ab1!" });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/8/));
    expect(stub.callsTo(REGISTER)).toHaveLength(0);
  });

  it("bloque un nom compose uniquement d'espaces (sans appel API)", async () => {
    const stub = renderRegister();
    await fill({ name: "   " });
    expect(await screen.findByText("Le nom est requis.")).toBeInTheDocument();
    expect(stub.callsTo(REGISTER)).toHaveLength(0);
  });

  it("message dedie sur 409 (email deja pris)", async () => {
    renderRegister({ [REGISTER]: { status: 409, body: { error: "conflict" } } });
    await fill();
    expect(await screen.findByText("Un compte existe déjà avec cet email.")).toBeInTheDocument();
  });

  it("message generique sur les autres erreurs et formulaire de nouveau soumettable", async () => {
    renderRegister({ [REGISTER]: { status: 500, body: { error: "boom" } } });
    await fill();
    expect(await screen.findByText("L'inscription a échoué. Réessayez.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /créer le compte/i })).toBeEnabled();
    });
  });

  it("message generique sur un 422 sans rapport avec les CGU", async () => {
    renderRegister({ [REGISTER]: { status: 422, body: { error: "weak_password" } } });
    await fill();
    expect(await screen.findByText("L'inscription a échoué. Réessayez.")).toBeInTheDocument();
  });
});
