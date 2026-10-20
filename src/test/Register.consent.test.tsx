import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  renderPortalAt,
  enterText,
  setupUser,
  STRONG_PASSWORD,
  stubAuthApi,
  TEST_TERMS_VERSION,
  type ApiStub,
} from "./authPortalTestKit";

const CONSENT_LABEL = /j'ai lu et j'accepte les/i;
const CGU_LINK = /conditions générales d'utilisation/i;
const SUBMIT = /créer le compte/i;
const REGISTER = "POST /api/auth/register";
const TERMS_REQUIRED =
  "Vous devez accepter les Conditions Générales d'Utilisation pour créer un compte.";
const TERMS_MISMATCH = [
  "Les Conditions Générales d'Utilisation ont été mises à jour.",
  "Rechargez la page pour accepter la nouvelle version.",
].join(" ");

function renderRegister(registerStatus = 201, registerBody: unknown = {}): ApiStub {
  const stub = stubAuthApi({ [REGISTER]: { status: registerStatus, body: registerBody } });
  renderPortalAt("/register");
  return stub;
}

async function fillValidFields() {
  const user = setupUser();
  await enterText(user, await screen.findByLabelText(/^nom/i), "Camille");
  await enterText(user, screen.getByLabelText(/^email/i), "nouveau@example.test");
  await enterText(user, screen.getByLabelText(/^mot de passe/i), STRONG_PASSWORD);
  await enterText(user, screen.getByLabelText(/confirmation/i), STRONG_PASSWORD);
  return user;
}

function consentCheckbox() {
  return screen.getByRole("checkbox", { name: CONSENT_LABEL }) as HTMLInputElement;
}

function checkboxErrorMessage(): string | null {
  const describedBy = consentCheckbox().getAttribute("aria-describedby");
  if (!describedBy) return null;
  return document.getElementById(describedBy.split(" ")[0])?.textContent ?? null;
}

function submitForm() {
  const form = screen.getByRole("button", { name: SUBMIT }).closest("form");
  fireEvent.submit(form as HTMLFormElement);
}

async function acceptAndSubmit() {
  const user = await fillValidFields();
  await user.click(consentCheckbox());
  await user.click(screen.getByRole("button", { name: SUBMIT }));
}

async function renderedForm() {
  await screen.findByLabelText(/^nom/i);
}

describe("inscription - checkbox et lien CGU", () => {
  it("la checkbox d'acceptation n'est pas pre-cochee par defaut", async () => {
    renderRegister();
    await renderedForm();
    expect(consentCheckbox()).not.toBeChecked();
  });

  it("ne presente qu'une seule mention CGU cliquable, portee par le sublabel", async () => {
    renderRegister();
    await renderedForm();
    expect(screen.getAllByRole("link", { name: CGU_LINK })).toHaveLength(1);
  });

  it("le libelle de la case ne contient pas de lien", async () => {
    renderRegister();
    await renderedForm();
    const label = screen.getByText(CONSENT_LABEL).closest("label");
    expect(label).not.toBeNull();
    expect(within(label as HTMLElement).queryByRole("link")).not.toBeInTheDocument();
  });

  it("expose conditions generales d'utilisation comme lien vers /cgu", async () => {
    renderRegister();
    await renderedForm();
    expect(screen.getByRole("link", { name: CGU_LINK })).toHaveAttribute("href", "/cgu");
  });

  it("ouvre le lien CGU dans un nouvel onglet avec rel noopener", async () => {
    renderRegister();
    await renderedForm();
    const link = screen.getByRole("link", { name: CGU_LINK });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
  });

  it("le clic sur le lien CGU ne coche pas la case", async () => {
    renderRegister();
    await renderedForm();
    const link = screen.getByRole("link", { name: CGU_LINK });
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(consentCheckbox().checked).toBe(false);
  });

  it("le clic sur le lien CGU n'est pas intercepte (defaultPrevented false)", async () => {
    renderRegister();
    await renderedForm();
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByRole("link", { name: CGU_LINK }).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("inscription - une case egale un objet", () => {
  it("ne presente qu'une seule checkbox dediee a l'acceptation des CGU", async () => {
    renderRegister();
    await renderedForm();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(1);
    expect(checkboxes[0]).toHaveAccessibleName(CONSENT_LABEL);
  });
});

describe("inscription - blocage de la soumission sans consentement", () => {
  it("garde le bouton desactive tant que la case n'est pas cochee", async () => {
    renderRegister();
    const user = await fillValidFields();
    expect(screen.getByRole("button", { name: SUBMIT })).toBeDisabled();
    await user.click(consentCheckbox());
    await waitFor(() => expect(screen.getByRole("button", { name: SUBMIT })).toBeEnabled());
  });

  it("n'appelle pas register sur soumission forcee sans consentement", async () => {
    const stub = renderRegister();
    await fillValidFields();
    submitForm();
    await waitFor(() => expect(checkboxErrorMessage()).toBe(TERMS_REQUIRED));
    expect(stub.callsTo(REGISTER)).toHaveLength(0);
  });

  it("associe un message d'erreur accessible a la checkbox sur soumission forcee", async () => {
    renderRegister();
    await fillValidFields();
    submitForm();
    await waitFor(() => expect(consentCheckbox()).toHaveAttribute("aria-invalid", "true"));
    expect(consentCheckbox()).toHaveAttribute("aria-describedby");
    expect(checkboxErrorMessage()).toBeTruthy();
  });

  it("efface l'erreur de consentement des que la case est cochee", async () => {
    renderRegister();
    const user = await fillValidFields();
    submitForm();
    await waitFor(() => expect(checkboxErrorMessage()).toBe(TERMS_REQUIRED));
    await user.click(consentCheckbox());
    await waitFor(() => expect(consentCheckbox()).not.toHaveAttribute("aria-invalid", "true"));
  });
});

describe("inscription - payload et traitement des 422 lies aux CGU", () => {
  it("envoie accepted_terms_version egal a la version des CGU configuree", async () => {
    const stub = renderRegister();
    await acceptAndSubmit();
    await waitFor(() => expect(stub.callsTo(REGISTER)).toHaveLength(1));
    expect(stub.callsTo(REGISTER)[0].body).toMatchObject({
      accepted_terms_version: TEST_TERMS_VERSION,
    });
  });

  it("affiche un message sur la checkbox sur un 422 terms_not_accepted", async () => {
    renderRegister(422, { error: "terms_not_accepted" });
    await acceptAndSubmit();
    await waitFor(() => expect(consentCheckbox()).toHaveAttribute("aria-invalid", "true"));
    expect(checkboxErrorMessage()).toBe(TERMS_REQUIRED);
  });

  it("affiche un message dedie sur la checkbox sur un 422 terms_version_mismatch", async () => {
    renderRegister(422, { error: "terms_version_mismatch" });
    await acceptAndSubmit();
    await waitFor(() => expect(consentCheckbox()).toHaveAttribute("aria-invalid", "true"));
    expect(checkboxErrorMessage()).toBe(TERMS_MISMATCH);
    expect(TERMS_MISMATCH).not.toBe(TERMS_REQUIRED);
  });
});

describe("inscription - accessibilite du champ de consentement", () => {
  it("associe un nom accessible a la checkbox via son libelle", async () => {
    renderRegister();
    await renderedForm();
    expect(consentCheckbox()).toHaveAccessibleName(CONSENT_LABEL);
  });

  it("associe le message d'erreur a la checkbox via aria-describedby et aria-invalid", async () => {
    renderRegister();
    await fillValidFields();
    submitForm();
    await waitFor(() => expect(consentCheckbox()).toHaveAttribute("aria-invalid", "true"));
    const describedBy = consentCheckbox().getAttribute("aria-describedby");
    const messageEl = document.getElementById((describedBy as string).split(" ")[0]);
    expect(messageEl?.textContent?.trim().length).toBeGreaterThan(0);
  });
});
