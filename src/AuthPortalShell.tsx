import { CanopI18nProvider, CanopThemeProvider } from "@canop/ui";
import { BrowserRouter } from "react-router-dom";
import { AuthPortalProvider } from "./config/AuthPortalProvider";
import type { ResolvedAuthPortalConfig } from "./config/authPortalConfig";
import { AuthPortalRoutes } from "./routes/AuthPortalRoutes";

export interface AuthPortalShellProps {
  resolved: ResolvedAuthPortalConfig;
}

export function AuthPortalShell({ resolved }: AuthPortalShellProps) {
  return (
    <CanopI18nProvider locale={resolved.defaultLocale} messages={resolved.messages}>
      <CanopThemeProvider {...resolved.branding.theme}>
        <BrowserRouter>
          <AuthPortalProvider config={resolved}>
            <AuthPortalRoutes />
          </AuthPortalProvider>
        </BrowserRouter>
      </CanopThemeProvider>
    </CanopI18nProvider>
  );
}
