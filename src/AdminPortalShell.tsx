import { CanopI18nProvider, CanopThemeProvider } from "@canop/ui";
import { BrowserRouter } from "react-router-dom";
import { AdminPortalProvider } from "./config/AdminPortalProvider";
import type { ResolvedAdminPortalConfig } from "./config/adminPortalConfig";
import { AdminPortalRoutes } from "./routes/AdminPortalRoutes";

export interface AdminPortalShellProps {
  resolved: ResolvedAdminPortalConfig;
}

export function AdminPortalShell({ resolved }: AdminPortalShellProps) {
  return (
    <CanopI18nProvider locale={resolved.defaultLocale} messages={resolved.messages}>
      <CanopThemeProvider {...resolved.branding.theme}>
        <BrowserRouter>
          <AdminPortalProvider config={resolved}>
            <AdminPortalRoutes />
          </AdminPortalProvider>
        </BrowserRouter>
      </CanopThemeProvider>
    </CanopI18nProvider>
  );
}
