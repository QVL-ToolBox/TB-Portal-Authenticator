import { createContext, useContext } from "react";
import type { AdminApi } from "../api/adminApi";
import type { AuthApi } from "../api/authApi";
import type { ResolvedAdminPortalConfig } from "./adminPortalConfig";

export interface AdminSession {
  loginUrl: () => string;
  cguUrl: (legalNoticeAnchor?: string) => string;
  redirectToLogin: () => void;
}

export interface AdminPortalContextValue {
  config: ResolvedAdminPortalConfig;
  api: AuthApi;
  adminApi: AdminApi;
  session: AdminSession;
}

export const AdminPortalContext = createContext<AdminPortalContextValue | null>(null);

export function useAdminPortal(): AdminPortalContextValue {
  const value = useContext(AdminPortalContext);
  if (!value) {
    throw new Error("useAdminPortal doit etre appele sous un AdminPortalProvider");
  }
  return value;
}

export function useOptionalAdminPortal(): AdminPortalContextValue | null {
  return useContext(AdminPortalContext);
}
