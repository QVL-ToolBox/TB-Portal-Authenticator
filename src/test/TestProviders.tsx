import { CanopI18nProvider, CanopThemeProvider, type CanopLocale } from "@canop/ui";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthPortalProvider, resolveAuthPortalConfig, type AuthPortalConfig } from "../index";
import { TEST_CONFIG } from "./testConfig";

export function TestProviders({
  children,
  config = TEST_CONFIG,
  url = "/",
  locale = "fr",
}: {
  children: ReactNode;
  config?: AuthPortalConfig;
  url?: string;
  locale?: CanopLocale;
}) {
  const resolved = resolveAuthPortalConfig(config);
  return (
    <CanopI18nProvider locale={locale} messages={resolved.messages}>
      <CanopThemeProvider>
        <MemoryRouter initialEntries={[url]}>
          <AuthPortalProvider config={resolved}>{children}</AuthPortalProvider>
        </MemoryRouter>
      </CanopThemeProvider>
    </CanopI18nProvider>
  );
}
