import type { CanopLayoutProps } from "@canop/ui";
import { render, screen, within } from "@testing-library/react";
import { forwardRef, memo, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  AuthBrandLayout,
  AuthPortalConfigError,
  createAuthApp,
  useAuthPortal,
  type AuthPortalConfig,
  type PortalLayoutProps,
} from "../index";
import { currentLocation, findHeading, stubAuthApi, TEST_CONFIG } from "./authPortalTestKit";

const captured = vi.hoisted(() => ({ layouts: [] as unknown[] }));

vi.mock("@canop/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@canop/ui")>();
  return {
    ...actual,
    Layout: (props: CanopLayoutProps) => {
      captured.layouts.push(props);
      return <actual.Layout {...props} />;
    },
  };
});

function AcmeLayout({ children }: PortalLayoutProps) {
  const { config } = useAuthPortal();
  return (
    <section data-testid="acme-layout" data-app={config.appName}>
      {children}
    </section>
  );
}

function renderAuthApp(config: AuthPortalConfig, url = "/login") {
  captured.layouts.length = 0;
  stubAuthApi();
  window.history.replaceState({}, "", url);
  const App = createAuthApp(config);
  render(<App />);
}

function startupErrorOf(config: unknown): unknown {
  try {
    createAuthApp(config as AuthPortalConfig);
  } catch (error) {
    return error;
  }
  return null;
}

const withBranding = (branding: Record<string, unknown>): AuthPortalConfig =>
  ({ ...TEST_CONFIG, branding }) as AuthPortalConfig;

describe("branding.layout - cadre remplacable du portail d'auth", () => {
  it.each(["/login", "/register", "/forgot-password", "/cgu"])(
    "Given un branding.layout, When %s s'affiche, Then la page est rendue dans ce cadre",
    async (url) => {
      renderAuthApp(withBranding({ layout: AcmeLayout }), url);

      const layout = await screen.findByTestId("acme-layout");
      expect((await within(layout).findAllByRole("heading")).length).toBeGreaterThan(0);
    },
  );

  it("Given un branding.layout, When la page de connexion s'affiche, Then le cadre par defaut n'est pas rendu", async () => {
    renderAuthApp(withBranding({ layout: AcmeLayout }));

    const layout = await screen.findByTestId("acme-layout");
    expect(within(layout).getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(captured.layouts).toHaveLength(0);
  });

  it("Given un branding.layout, When il lit useAuthPortal, Then il accede a la config du portail", async () => {
    renderAuthApp(withBranding({ layout: AcmeLayout }));

    expect(await screen.findByTestId("acme-layout")).toHaveAttribute(
      "data-app",
      TEST_CONFIG.appName,
    );
  });

  it("Given un branding.layout memoise, When la page de connexion s'affiche, Then il est accepte et enveloppe la page", async () => {
    renderAuthApp(withBranding({ layout: memo(AcmeLayout) }));

    const layout = await screen.findByTestId("acme-layout");
    expect(within(layout).getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  });

  it("Given un branding.layout forwardRef, When la page de connexion s'affiche, Then il est accepte et enveloppe la page", async () => {
    const RefLayout = forwardRef<HTMLDivElement, { children?: ReactNode }>(function RefLayout(
      { children },
      ref,
    ) {
      return (
        <div ref={ref} data-testid="ref-layout">
          {children}
        </div>
      );
    });
    renderAuthApp(withBranding({ layout: RefLayout }));

    const layout = await screen.findByTestId("ref-layout");
    expect(within(layout).getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
  });

  it("Given un branding.layout qui compose AuthBrandLayout, When la page s'affiche, Then le cadre par defaut est rendu a l'interieur", async () => {
    function WrappedLayout({ children }: PortalLayoutProps) {
      return (
        <div data-testid="wrapper">
          <AuthBrandLayout>{children}</AuthBrandLayout>
        </div>
      );
    }
    renderAuthApp(withBranding({ layout: WrappedLayout }));

    const wrapper = await screen.findByTestId("wrapper");
    expect(within(wrapper).getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(captured.layouts.length).toBeGreaterThan(0);
  });

  it("Given aucun branding.layout, When la page de connexion s'affiche, Then le cadre par defaut AuthBrandLayout est rendu", async () => {
    renderAuthApp(TEST_CONFIG);

    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(captured.layouts.length).toBeGreaterThan(0);
    expect(screen.queryByTestId("acme-layout")).not.toBeInTheDocument();
  });

  it("Given branding.layout undefined, When la page de connexion s'affiche, Then le cadre par defaut est rendu", async () => {
    renderAuthApp(withBranding({ layout: undefined }));

    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(captured.layouts.length).toBeGreaterThan(0);
  });

  const expectLayoutRejected = (layout: unknown) => {
    const error = startupErrorOf(withBranding({ layout }));

    expect(error).toBeInstanceOf(AuthPortalConfigError);
    expect((error as Error).message).toMatch(/layout/);
  };

  it.each([
    ["une chaine", "AcmeLayout"],
    ["un nombre", 42],
    ["un booleen", true],
  ])(
    "Given branding.layout %s, When createAuthApp est appele, Then il leve une AuthPortalConfigError",
    (_, layout) => {
      expectLayoutRejected(layout);
    },
  );

  const acceptedNonComponents: [string, unknown][] = [
    ["un objet", {}],
    ["une liste", []],
    ["un element React", <div key="x" />],
  ];

  for (const [label, layout] of acceptedNonComponents) {
    it(`Given branding.layout ${label}, When createAuthApp est appele, Then il devrait lever une AuthPortalConfigError`, () => {
      expectLayoutRejected(layout);
    });
  }
});

describe("branding.footer - pied de page du portail d'auth", () => {
  const footer = <p data-testid="acme-footer">Acme SAS - mentions</p>;

  it.each(["/login", "/register", "/forgot-password", "/cgu"])(
    "Given un branding.footer, When %s s'affiche, Then le pied de page est affiche",
    async (url) => {
      renderAuthApp(withBranding({ footer }), url);

      expect(await screen.findByTestId("acme-footer")).toHaveTextContent("Acme SAS - mentions");
    },
  );

  it("Given un branding.footer et un branding.layout, When la page de connexion s'affiche, Then le pied de page est affiche dans le portail", async () => {
    renderAuthApp(withBranding({ footer, layout: AcmeLayout }));

    expect(await screen.findByTestId("acme-footer")).toBeInTheDocument();
    expect(await findHeading("Connexion")).toBeInTheDocument();
  });

  it("Given aucun branding.footer, When la page de connexion s'affiche, Then aucun pied de page personnalise n'est affiche", async () => {
    renderAuthApp(TEST_CONFIG);

    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(screen.queryByTestId("acme-footer")).not.toBeInTheDocument();
  });

  it("Given un branding.footer, When on navigue vers une route inconnue, Then la connexion s'affiche avec le pied de page", async () => {
    renderAuthApp(withBranding({ footer }), "/inconnue");

    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(currentLocation()).toBe("/login");
    expect(screen.getByTestId("acme-footer")).toBeInTheDocument();
  });
});
