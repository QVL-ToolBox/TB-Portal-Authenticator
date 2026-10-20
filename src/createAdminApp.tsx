import type { ComponentType } from "react";
import { AdminPortalShell } from "./AdminPortalShell";
import { resolveAdminPortalConfig, type AdminPortalConfig } from "./config/adminPortalConfig";

export function createAdminApp(config: AdminPortalConfig): ComponentType {
  const resolved = resolveAdminPortalConfig(config);

  function AdminApp() {
    return <AdminPortalShell resolved={resolved} />;
  }

  return AdminApp;
}
