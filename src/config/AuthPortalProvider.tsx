import type { ReactNode } from "react";
import { AuthPortalContext } from "./AuthPortalContext";
import type { ResolvedAuthPortalConfig } from "./authPortalConfig";
import { useAuthPortalValue } from "./useAuthPortalValue";

export interface AuthPortalProviderProps {
  config: ResolvedAuthPortalConfig;
  children: ReactNode;
}

export function AuthPortalProvider({ config, children }: AuthPortalProviderProps) {
  const value = useAuthPortalValue(config);
  return <AuthPortalContext.Provider value={value}>{children}</AuthPortalContext.Provider>;
}
