import { createContext, useContext } from "react";
import type { AdminApi } from "../api/adminApi";
import type { AuthApi } from "../api/authApi";
import type { ResolvedAuthPortalConfig } from "./authPortalConfig";

export interface AuthPortalContextValue {
  config: ResolvedAuthPortalConfig;
  api: AuthApi;
  adminApi: AdminApi;
}

export const AuthPortalContext = createContext<AuthPortalContextValue | null>(null);

export function useAuthPortal(): AuthPortalContextValue {
  const value = useContext(AuthPortalContext);
  if (!value) {
    throw new Error("useAuthPortal doit etre appele sous un AuthPortalProvider");
  }
  return value;
}
