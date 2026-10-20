import { useTranslation } from "@canop/ui";
import { useCallback } from "react";
import type { Me } from "../api/authApi";
import { useAdminPortal } from "../config/AdminPortalContext";
import { hasRole } from "../session/hasRole";
import { isSessionLostError } from "../session/isSessionLostError";

export function useRequireAdmin() {
  const { t } = useTranslation();
  const { api, config, session } = useAdminPortal();
  const { adminRole } = config;

  const fetchUser = useCallback(() => api.getMe(), [api]);
  const hasAccess = useCallback((user: Me) => hasRole(user, adminRole), [adminRole]);

  return {
    fetchUser,
    hasAccess,
    isUnauthorizedError: isSessionLostError,
    onUnauthorized: session.redirectToLogin,
    loadingLabel: t("auth.loading"),
    errorLabel: t("auth.admin.guard.loadError"),
  };
}
