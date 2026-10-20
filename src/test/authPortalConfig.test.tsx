import { render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  authPortalMessages,
  DEFAULT_API_BASE_PATH,
  DEFAULT_TERMS_SERVICES,
  mergeAuthPortalMessages,
  resolveAuthPortalConfig,
  useAuthPortal,
} from "../index";
import { TEST_CONFIG, TestProviders } from "./authPortalTestKit";

function ConfigProbe() {
  const { config, api } = useAuthPortal();
  return (
    <p>
      {config.appName}|{config.apiBasePath}|{typeof api.login}
    </p>
  );
}

describe("configuration du portail", () => {
  it("applique les valeurs par defaut (chemin d'API, services des CGU, pas de logo)", () => {
    const resolved = resolveAuthPortalConfig(TEST_CONFIG);
    expect(resolved.apiBasePath).toBe(DEFAULT_API_BASE_PATH);
    expect(DEFAULT_API_BASE_PATH).toBe("/api/auth");
    expect(resolved.terms.services).toEqual(DEFAULT_TERMS_SERVICES);
    expect(resolved.branding.logo).toBeUndefined();
  });

  it("conserve les valeurs fournies par le projet", () => {
    const resolved = resolveAuthPortalConfig({
      appName: "Autre",
      apiBasePath: "/edge/auth",
      branding: { logo: "logo" },
      terms: { version: "v9", effectiveDate: "2027-02-02", services: ["a", "b"] },
    });
    expect(resolved).toMatchObject({
      appName: "Autre",
      apiBasePath: "/edge/auth",
      branding: { logo: "logo" },
      terms: { version: "v9", effectiveDate: "2027-02-02", services: ["a", "b"] },
    });
  });

  it("fusionne les surcharges de messages par locale sans perdre les textes fournis", () => {
    const merged = mergeAuthPortalMessages({ fr: { "auth.login.title": "Entrer" } });
    expect(merged.fr["auth.login.title"]).toBe("Entrer");
    expect(merged.fr["auth.register.title"]).toBe(authPortalMessages.fr["auth.register.title"]);
    expect(merged.en).toEqual(authPortalMessages.en);
  });

  it("fournit les memes cles en francais et en anglais", () => {
    expect(Object.keys(authPortalMessages.en).sort()).toEqual(
      Object.keys(authPortalMessages.fr).sort(),
    );
  });

  it("refuse useAuthPortal hors d'un AuthPortalProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuthPortal())).toThrow(/AuthPortalProvider/);
  });

  it("expose la configuration resolue et le client API sous AuthPortalProvider", () => {
    render(
      <TestProviders>
        <ConfigProbe />
      </TestProviders>,
    );
    expect(screen.getByText(`${TEST_CONFIG.appName}|/api/auth|function`)).toBeInTheDocument();
  });
});
