import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { authPortalMessages, CguPage, LegalNotice } from "../index";
import {
  findHeading,
  renderPortalAt,
  stubAuthApi,
  stubMatchMedia,
  TEST_APP_NAME,
  TEST_CONFIG,
  TEST_TERMS_DATE_FR,
  TEST_TERMS_VERSION,
  TestProviders,
  type PortalRenderOptions,
} from "./authPortalTestKit";

const fr = authPortalMessages.fr;
const CGU_TITLE = fr["auth.cgu.title"];
const LEGAL_TITLE = fr["auth.legal.title"];
const LOGIN_TITLE = fr["auth.login.title"];
const VERSION_LABEL = `Version ${TEST_TERMS_VERSION} — en vigueur au ${TEST_TERMS_DATE_FR}`;

async function renderCgu(url = "/cgu", options: PortalRenderOptions = {}) {
  const stub = stubAuthApi();
  const view = renderPortalAt(url, options);
  await findHeading(CGU_TITLE);
  return { stub, view };
}

describe("page CGU + mentions legales", () => {
  it("affiche les CGU et les mentions legales sur la meme page", async () => {
    await renderCgu();
    expect(screen.getByRole("heading", { name: LEGAL_TITLE })).toBeInTheDocument();
  });

  it("affiche les douze articles des CGU", async () => {
    await renderCgu();
    expect(screen.getByRole("heading", { name: "1. Objet" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "12. Droit applicable et juridiction compétente" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /^\d+\. / })).toHaveLength(12);
  });
});

describe("CGU - route stable et ancre", () => {
  it("la page est servie sur l'URL /cgu et non le fallback de connexion", async () => {
    await renderCgu();
    expect(screen.queryByRole("heading", { name: LOGIN_TITLE })).not.toBeInTheDocument();
  });

  it("la section mentions legales est ciblable par l'ancre #mentions-legales", async () => {
    const { view } = await renderCgu();
    const anchor = view.container.querySelector("#mentions-legales");
    expect(anchor).not.toBeNull();
    expect(within(anchor as HTMLElement).getByText(LEGAL_TITLE)).toBeInTheDocument();
  });

  it("l'URL /cgu#mentions-legales fait defiler doucement jusqu'aux mentions legales", async () => {
    const { view } = await renderCgu("/cgu#mentions-legales");
    const anchor = view.container.querySelector("#mentions-legales") as HTMLElement;
    await waitFor(() =>
      expect(anchor.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" }),
    );
  });

  it("respecte la preference de mouvement reduit lors du defilement vers l'ancre", async () => {
    stubMatchMedia(true);
    const { view } = await renderCgu("/cgu#mentions-legales");
    const anchor = view.container.querySelector("#mentions-legales") as HTMLElement;
    await waitFor(() =>
      expect(anchor.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" }),
    );
  });

  it("une ancre inconnue ne provoque aucun defilement", async () => {
    await renderCgu("/cgu#inexistante");
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("sans ancre, la page ne defile pas", async () => {
    await renderCgu("/cgu");
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("CGU - consultation sans authentification", () => {
  it("reste sur /cgu sans rediriger vers /login quand la session est absente", async () => {
    await renderCgu();
    expect(window.location.pathname).toBe("/cgu");
  });

  it("ne declenche aucun appel authentifie GET /me a l'affichage de la page", async () => {
    const { stub } = await renderCgu();
    expect(stub.callsTo("GET /api/auth/me")).toHaveLength(0);
  });
});

describe("CGU propres a l'application", () => {
  it("citent le nom de l'application configure sans parametre non resolu", async () => {
    const { view } = await renderCgu();
    expect(view.container.textContent).toContain(`suite de services ${TEST_APP_NAME}`);
    expect(view.container.textContent).not.toContain("{appName}");
  });

  it("listent par defaut le seul service d'authentification", async () => {
    await renderCgu();
    expect(screen.getByText(fr["auth.cgu.services.authenticator"] as string)).toBeInTheDocument();
  });

  it("listent les services declares par le projet avec leurs textes surcharges", async () => {
    await renderCgu("/cgu", {
      config: {
        ...TEST_CONFIG,
        terms: { ...TEST_CONFIG.terms, services: ["authenticator", "catalogue"] },
      },
      messages: { fr: { "auth.cgu.services.catalogue": "un catalogue de demonstration ;" } },
    });
    expect(screen.getByText("un catalogue de demonstration ;")).toBeInTheDocument();
  });
});

describe("CGU - version et date", () => {
  it("affiche la version et la date d'effet de la configuration", async () => {
    await renderCgu();
    expect(screen.getByText(VERSION_LABEL)).toBeInTheDocument();
  });

  it("formate la date d'effet selon la locale anglaise", async () => {
    stubAuthApi();
    render(
      <TestProviders url="/cgu" locale="en">
        <CguPage />
      </TestProviders>,
    );
    expect(
      await screen.findByText(
        `Version ${TEST_TERMS_VERSION} — effective as of ${TEST_TERMS_DATE_FR}`,
      ),
    ).toBeInTheDocument();
  });
});

describe("Mentions legales", () => {
  it("presentent le titre, l'introduction LCEN et les quatre blocs", () => {
    render(
      <TestProviders>
        <LegalNotice />
      </TestProviders>,
    );
    expect(screen.getByRole("heading", { level: 3, name: LEGAL_TITLE })).toBeInTheDocument();
    expect(screen.getByText(fr["auth.legal.intro"] as string)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 4 }).map((h) => h.textContent)).toEqual([
      "Éditeur",
      "Contact",
      "Directeur de la publication",
      "Hébergeur",
    ]);
  });

  it("presentent chaque champ avec son libelle et sa valeur", () => {
    render(
      <TestProviders>
        <LegalNotice />
      </TestProviders>,
    );
    expect(screen.getByText("Raison sociale")).toBeInTheDocument();
    expect(
      screen.getByText(fr["auth.legal.editor.companyName.value"] as string),
    ).toBeInTheDocument();
    expect(screen.getByText(fr["auth.legal.host.contact.value"] as string)).toBeInTheDocument();
  });
});
