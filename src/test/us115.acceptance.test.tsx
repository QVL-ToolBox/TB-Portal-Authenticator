import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AuthPortalConfigError,
  createAuthApp,
  defaultCguSections,
  type AuthPortalConfig,
} from "../index";
import {
  captureCookieWrites,
  captureDocumentNavigation,
  currentLocation,
  enterText,
  findHeading,
  renderPortalAt,
  setupUser,
  STRONG_PASSWORD,
  stubAuthApi,
  TEST_CONFIG,
} from "./authPortalTestKit";

const CGU_TITLE = "Conditions Générales d'Utilisation";
const BASE: AuthPortalConfig = { appName: "Zephyrine", terms: TEST_CONFIG.terms };

type Sections = NonNullable<AuthPortalConfig["terms"]["sections"]>;

const CUSTOM_MESSAGES = {
  fr: {
    "auth.cgu.preambule.title": "Préambule maison",
    "auth.cgu.preambule.body": "Bienvenue sur {appName}, service de test.",
    "auth.cgu.regles.title": "Règles maison",
    "auth.cgu.regles.intro": "Sur {appName}, vous vous engagez à :",
    "auth.cgu.regles.respect": "respecter autrui ;",
    "auth.cgu.regles.loyaute": "agir loyalement.",
    "auth.cgu.fin.title": "Clôture maison",
    "auth.cgu.fin.body": "Fin des conditions.",
  },
};

const CUSTOM_SECTIONS: Sections = [
  { key: "preambule", kind: "text" },
  { key: "regles", kind: "list", items: ["respect", "loyaute"] },
  { key: "fin", kind: "text" },
];

function withSections(sections: unknown): AuthPortalConfig {
  return {
    ...BASE,
    messages: CUSTOM_MESSAGES,
    terms: { ...BASE.terms, sections: sections as Sections },
  };
}

async function openCgu(config: AuthPortalConfig) {
  stubAuthApi();
  const view = renderPortalAt("/cgu", { config });
  await findHeading(CGU_TITLE);
  return view;
}

function headingTexts(): string[] {
  return screen.getAllByRole("heading").map((heading) => heading.textContent ?? "");
}

function positionOf(title: string): number {
  return headingTexts().findIndex((text) => text.includes(title));
}

function startupError(config: unknown): unknown {
  try {
    createAuthApp(config as AuthPortalConfig);
  } catch (error) {
    return error;
  }
  return null;
}

describe("AC1 - appName configurable affiche sur /cgu", () => {
  it("affiche le nom d'application configure dans les CGU", async () => {
    const view = await openCgu(BASE);
    expect(view.container.textContent).toContain("Zephyrine");
    expect(view.container.textContent).not.toContain("{appName}");
  });

  it("change le nom affiche quand le projet configure un autre appName", async () => {
    const view = await openCgu({ ...BASE, appName: "Orchidee Nord" });
    expect(view.container.textContent).toContain("Orchidee Nord");
    expect(view.container.textContent).not.toContain("Zephyrine");
  });
});

describe("AC2 - terms_version_mismatch affiche sur la case CGU", () => {
  async function submitRegistrationRejectedWith(body: unknown) {
    stubAuthApi({ "POST /api/auth/register": { status: 422, body } });
    renderPortalAt("/register");
    const user = setupUser();
    await enterText(user, await screen.findByLabelText(/^nom/i), "Camille");
    await enterText(user, screen.getByLabelText(/^email/i), "camille@example.test");
    await enterText(user, screen.getByLabelText(/^mot de passe/i), STRONG_PASSWORD);
    await enterText(user, screen.getByLabelText(/confirmation/i), STRONG_PASSWORD);
    const checkbox = screen.getByRole("checkbox", { name: /j'accepte/i });
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: /créer le compte/i }));
    return checkbox;
  }

  function describedText(element: HTMLElement): string {
    const ids = (element.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
    return ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
  }

  it("marque la case CGU en erreur avec un message de mise a jour des CGU", async () => {
    const checkbox = await submitRegistrationRejectedWith({ error: "terms_version_mismatch" });
    await waitFor(() => expect(checkbox).toHaveAttribute("aria-invalid", "true"));
    expect(describedText(checkbox)).toMatch(/mises à jour/i);
  });

  it("ne marque pas les autres champs du formulaire en erreur", async () => {
    const checkbox = await submitRegistrationRejectedWith({ error: "terms_version_mismatch" });
    await waitFor(() => expect(checkbox).toHaveAttribute("aria-invalid", "true"));
    for (const label of [/^nom/i, /^email/i, /^mot de passe/i, /confirmation/i]) {
      expect(screen.getByLabelText(label)).not.toHaveAttribute("aria-invalid", "true");
    }
  });
});

describe("AC3 - compte en attente redirige vers /pending", () => {
  async function signInRejectedWith(status: number, error: string) {
    stubAuthApi({ "POST /api/auth/login": { status, body: { error } } });
    renderPortalAt("/login");
    const user = setupUser();
    await enterText(user, await screen.findByLabelText(/email/i), "camille@example.test");
    await enterText(user, screen.getByLabelText(/mot de passe/i), "secret123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));
  }

  it("redirige vers /pending sur un 403 account_pending", async () => {
    await signInRejectedWith(403, "account_pending");
    await waitFor(() => expect(currentLocation()).toBe("/pending"));
  });

  it("ne redirige pas vers /pending sur un autre refus 403", async () => {
    await signInRejectedWith(403, "account_disabled");
    expect(await screen.findByText(/désactivé/i)).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
  });
});

describe("AC4 - domaine du cookie de redirection configurable", () => {
  const COOKIE = "zephyr_redirect";

  function redirectConfig(cookieDomain: unknown): AuthPortalConfig {
    return {
      ...BASE,
      redirect: { cookieName: COOKIE, cookieDomain: cookieDomain as string },
    };
  }

  it("efface le cookie de redirection sur le domaine configure apres connexion", async () => {
    const navigations = captureDocumentNavigation();
    const writes = captureCookieWrites();
    stubAuthApi({ "POST /api/auth/login": { status: 200, body: {} } });
    document.cookie = `${COOKIE}=${encodeURIComponent("/depuis-cookie")}; Path=/`;
    window.history.pushState({}, "", "/login?redirect=1");
    const App = createAuthApp(redirectConfig("localhost"));
    render(<App />);
    const user = setupUser();
    await enterText(user, await screen.findByLabelText(/email/i), "camille@example.test");
    await enterText(user, screen.getByLabelText(/mot de passe/i), "secret123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));
    await waitFor(() => expect(navigations.at(-1) ?? currentLocation()).toBe("/depuis-cookie"));
    const clearing = writes.filter((write) => write.startsWith(`${COOKIE}=`)).at(-1);
    expect(clearing).toMatch(/domain=localhost/i);
    expect(document.cookie).not.toContain(`${COOKIE}=`);
  });

  it("accepte un domaine valide au demarrage", () => {
    expect(startupError(redirectConfig(".example.test"))).toBeNull();
  });

  it.each([
    ["injection d'attribut", "example.test; Secure"],
    ["espace", "exa mple.test"],
    ["valeur non textuelle", 42],
    ["retour a la ligne", "example.test\nPath=/"],
  ])("rejette au demarrage un domaine invalide : %s", (_, cookieDomain) => {
    expect(startupError(redirectConfig(cookieDomain))).toBeInstanceOf(AuthPortalConfigError);
  });
});

describe("AC5 - sections des CGU injectables", () => {
  it("rend les sections fournies dans l'ordre declare", async () => {
    await openCgu(withSections(CUSTOM_SECTIONS));
    const positions = ["Préambule maison", "Règles maison", "Clôture maison"].map(positionOf);
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("suit l'ordre inverse quand le consommateur inverse les sections", async () => {
    await openCgu(withSections([...CUSTOM_SECTIONS].reverse()));
    expect(positionOf("Clôture maison")).toBeLessThan(positionOf("Règles maison"));
    expect(positionOf("Règles maison")).toBeLessThan(positionOf("Préambule maison"));
  });

  it("rend une section text avec son titre et son corps", async () => {
    await openCgu(withSections(CUSTOM_SECTIONS));
    expect(screen.getByText("Fin des conditions.")).toBeInTheDocument();
  });

  it("rend une section list avec son introduction et ses items dans l'ordre", async () => {
    const view = await openCgu(withSections(CUSTOM_SECTIONS));
    expect(view.container.textContent).toContain("Sur Zephyrine, vous vous engagez à :");
    const items = within(screen.getByText("respecter autrui ;").closest("ul") as HTMLElement)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(items).toEqual(["respecter autrui ;", "agir loyalement."]);
  });

  it("insere le nom d'application dans les textes des sections", async () => {
    const view = await openCgu(withSections(CUSTOM_SECTIONS));
    expect(view.container.textContent).toContain("Bienvenue sur Zephyrine, service de test.");
    expect(view.container.textContent).not.toContain("{appName}");
  });

  it("remplace les articles par defaut par les sections fournies", async () => {
    await openCgu(withSections(CUSTOM_SECTIONS));
    expect(screen.queryByRole("heading", { name: /Objet/ })).not.toBeInTheDocument();
  });

  it.each([
    ["liste de sections vide", []],
    ["sections non tableau", { key: "fin", kind: "text" }],
    ["cle vide", [{ key: "", kind: "text" }]],
    ["cle avec espace", [{ key: "mauvaise cle", kind: "text" }]],
    ["cle avec point", [{ key: "a.b", kind: "text" }]],
    ["cle non textuelle", [{ key: 7, kind: "text" }]],
    ["kind inconnu", [{ key: "fin", kind: "table" }]],
    ["kind absent", [{ key: "fin" }]],
    ["liste sans items", [{ key: "regles", kind: "list" }]],
    ["liste aux items vides", [{ key: "regles", kind: "list", items: [] }]],
    ["item invalide", [{ key: "regles", kind: "list", items: ["bon", "mauvais item"] }]],
    ["item vide", [{ key: "regles", kind: "list", items: [""] }]],
    ["item non textuel", [{ key: "regles", kind: "list", items: [3] }]],
    [
      "cle en double",
      [
        { key: "fin", kind: "text" },
        { key: "fin", kind: "text" },
      ],
    ],
  ])("rejette au demarrage : %s", (_, sections) => {
    expect(startupError(withSections(sections))).toBeInstanceOf(AuthPortalConfigError);
  });

  it("accepte au demarrage des cles et items en lettres, chiffres, _ et -", () => {
    const sections = [
      { key: "art_1-bis", kind: "text" },
      { key: "liste2", kind: "list", items: ["item_a", "item-2"] },
    ];
    expect(startupError(withSections(sections))).toBeNull();
  });

  it("conserve les douze articles par defaut sans sections fournies", async () => {
    await openCgu(BASE);
    expect(screen.getAllByRole("heading", { name: /^\d+\. / })).toHaveLength(12);
  });

  it("rend a l'identique les sections par defaut passees explicitement", async () => {
    const services = ["authenticator"];
    const implicit = await openCgu({ ...BASE, terms: { ...BASE.terms, services } });
    const implicitText = implicit.container.textContent;
    implicit.unmount();
    const explicit = await openCgu({
      ...BASE,
      terms: { ...BASE.terms, services, sections: defaultCguSections(services) },
    });
    expect(explicit.container.textContent).toBe(implicitText);
  });
});
