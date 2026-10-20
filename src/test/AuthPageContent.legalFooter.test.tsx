import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthPageContent } from "../index";
import { stubMatchMedia, TestProviders } from "./authPortalTestKit";

const CGU_LABEL = /conditions g[ée]n[ée]rales d'utilisation/i;
const NOTICE_LABEL = /^mentions l[ée]gales$/i;
const LEGAL_INFO_LABEL = /informations l[ée]gales/i;

function renderContent() {
  return render(
    <TestProviders>
      <AuthPageContent title="Connexion">
        <p>contenu</p>
      </AuthPageContent>
    </TestProviders>,
  );
}

describe("AuthPageContent - aucun footer legal", () => {
  it("desktop : affiche le titre et le contenu sans lien CGU ni mentions legales", () => {
    stubMatchMedia(false);
    renderContent();
    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(screen.getByText("contenu")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: CGU_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: NOTICE_LABEL })).not.toBeInTheDocument();
  });

  it("mobile : n'expose aucun menu reglages, lien legal ni bouton d'informations legales", () => {
    stubMatchMedia(true);
    renderContent();
    expect(screen.queryByLabelText("Ouvrir le menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: CGU_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: NOTICE_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: LEGAL_INFO_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: LEGAL_INFO_LABEL })).not.toBeInTheDocument();
  });
});
