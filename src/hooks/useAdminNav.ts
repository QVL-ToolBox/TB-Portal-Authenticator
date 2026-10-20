import { useTranslation, type CanopSegmentedControlOption } from "@canop/ui";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_PORTAL_PATHS, type AdminPortalPath } from "../routes/adminPortalPaths";

function isAdminPath(pathname: string): pathname is AdminPortalPath {
  return Object.values<string>(ADMIN_PORTAL_PATHS).includes(pathname);
}

export function useAdminNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const options = useMemo<CanopSegmentedControlOption<AdminPortalPath>[]>(
    () => [
      { value: ADMIN_PORTAL_PATHS.users, label: t("auth.admin.nav.users"), icon: "user" },
      { value: ADMIN_PORTAL_PATHS.roles, label: t("auth.admin.nav.roles"), icon: "shield" },
      { value: ADMIN_PORTAL_PATHS.portals, label: t("auth.admin.nav.portals"), icon: "apps" },
    ],
    [t],
  );

  return {
    options,
    value: isAdminPath(pathname) ? pathname : ADMIN_PORTAL_PATHS.users,
    navigateTo: (path: AdminPortalPath) => navigate(path),
    ariaLabel: t("auth.admin.nav.label"),
  };
}
