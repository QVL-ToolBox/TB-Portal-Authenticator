import { AdminPortalShell } from "./AdminPortalShell";
import type { AdminPortalConfig } from "./config/adminPortalConfig";
import { useResolvedAdminPortalConfig } from "./config/useResolvedAdminPortalConfig";

export interface AdminPortalAppProps {
  config: AdminPortalConfig;
}

export function AdminPortalApp({ config }: AdminPortalAppProps) {
  const resolved = useResolvedAdminPortalConfig(config);
  return <AdminPortalShell resolved={resolved} />;
}
