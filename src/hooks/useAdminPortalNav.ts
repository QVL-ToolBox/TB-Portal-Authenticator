import { useTranslation, type CanopNavbarItem } from "@canop/ui";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_APP_PATHS } from "../routes/adminAppPaths";

export function useAdminPortalNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = useMemo<CanopNavbarItem[]>(
    () => [
      { label: t("auth.admin.nav.dashboard"), href: ADMIN_APP_PATHS.dashboard, icon: "home" },
      { label: t("auth.admin.nav.users"), href: ADMIN_APP_PATHS.users, icon: "user" },
      { label: t("auth.admin.nav.roles"), href: ADMIN_APP_PATHS.roles, icon: "shield" },
      { label: t("auth.admin.nav.portals"), href: ADMIN_APP_PATHS.portals, icon: "apps" },
    ],
    [t],
  );

  const onNavigate = useCallback((href: string) => navigate(href), [navigate]);

  return { items, activeHref: pathname, onNavigate };
}
