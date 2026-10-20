import { useMemo } from "react";
import {
  resolveAdminPortalConfig,
  type AdminPortalConfig,
  type ResolvedAdminPortalConfig,
} from "./adminPortalConfig";

export function useResolvedAdminPortalConfig(config: AdminPortalConfig): ResolvedAdminPortalConfig {
  return useMemo(() => resolveAdminPortalConfig(config), [config]);
}
