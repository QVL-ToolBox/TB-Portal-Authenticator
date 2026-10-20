import { useMemo } from "react";
import {
  resolveAuthPortalConfig,
  type AuthPortalConfig,
  type ResolvedAuthPortalConfig,
} from "./authPortalConfig";

export function useResolvedAuthPortalConfig(config: AuthPortalConfig): ResolvedAuthPortalConfig {
  return useMemo(() => resolveAuthPortalConfig(config), [config]);
}
