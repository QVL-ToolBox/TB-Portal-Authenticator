import { navigateTo, useTranslation } from "@canop/ui";
import { useCallback } from "react";
import { useAdminPortal } from "../config/AdminPortalContext";

export function useForbiddenPage() {
  const { t } = useTranslation();
  const { config, session } = useAdminPortal();
  const { loginUrl } = session;

  const switchAccount = useCallback(() => navigateTo(loginUrl()), [loginUrl]);

  return {
    appName: config.appName,
    title: t("auth.admin.forbidden.title"),
    message: t("auth.admin.forbidden.message"),
    switchLabel: t("auth.admin.forbidden.switch"),
    switchAccount,
  };
}
