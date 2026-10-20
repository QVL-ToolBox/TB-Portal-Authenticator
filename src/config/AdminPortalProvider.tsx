import type { ReactNode } from "react";
import { AdminPortalContext } from "./AdminPortalContext";
import type { ResolvedAdminPortalConfig } from "./adminPortalConfig";
import { useAdminPortalValue } from "./useAdminPortalValue";

export interface AdminPortalProviderProps {
  config: ResolvedAdminPortalConfig;
  children: ReactNode;
}

export function AdminPortalProvider({ config, children }: AdminPortalProviderProps) {
  const value = useAdminPortalValue(config);
  return <AdminPortalContext.Provider value={value}>{children}</AdminPortalContext.Provider>;
}
