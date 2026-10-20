import { useContext } from "react";
import type { AdminApi } from "../api/adminApi";
import { AdminPortalContext } from "../config/AdminPortalContext";
import { AuthPortalContext } from "../config/AuthPortalContext";

export function useAdminApi(): AdminApi {
  const adminPortal = useContext(AdminPortalContext);
  const authPortal = useContext(AuthPortalContext);
  const adminApi = adminPortal?.adminApi ?? authPortal?.adminApi;
  if (!adminApi) {
    throw new Error(
      "useAdminApi doit etre appele sous un AdminPortalProvider ou un AuthPortalProvider",
    );
  }
  return adminApi;
}
