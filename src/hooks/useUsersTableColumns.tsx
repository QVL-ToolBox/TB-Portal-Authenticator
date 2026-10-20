import { useTranslation, type CanopColumn } from "@canop/ui";
import { useMemo } from "react";
import type { AdminUser } from "../api/adminApi";
import { UserActiveToggle } from "../components/UserActiveToggle";

export function useUsersTableColumns(
  portalAccessLabel: (user: AdminUser) => string,
  onToggleActive: (user: AdminUser, active: boolean) => void,
): CanopColumn<AdminUser>[] {
  const { t } = useTranslation();

  return useMemo<CanopColumn<AdminUser>[]>(
    () => [
      { key: "name", header: t("auth.admin.users.col.name"), sortable: true, width: "22%" },
      {
        key: "email",
        header: t("auth.admin.users.col.email"),
        sortable: true,
        width: "28%",
        hideOnMobile: true,
      },
      {
        key: "roles",
        header: t("auth.admin.users.col.portals"),
        width: "26%",
        hideOnMobile: true,
        render: portalAccessLabel,
        sortValue: portalAccessLabel,
      },
      {
        key: "active",
        header: t("auth.admin.users.col.active"),
        width: "14%",
        align: "center",
        render: (user) => <UserActiveToggle user={user} onToggle={onToggleActive} />,
      },
    ],
    [onToggleActive, portalAccessLabel, t],
  );
}
