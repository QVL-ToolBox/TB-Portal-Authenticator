import { useTranslation, type CanopIconColor, type CanopIconName } from "@canop/ui";
import { useMemo } from "react";
import type { AccountStatus, AdminUser } from "../api/adminApi";

export interface DashboardStat {
  key: string;
  label: string;
  value: string;
  icon: CanopIconName;
  iconColor: CanopIconColor;
}

function countByStatus(users: readonly AdminUser[], status: AccountStatus): string {
  return String(users.filter((user) => user.status === status).length);
}

export function useDashboardStats(users: readonly AdminUser[]): DashboardStat[] {
  const { t } = useTranslation();

  return useMemo<DashboardStat[]>(
    () => [
      {
        key: "total",
        label: t("auth.admin.dashboard.stat.total"),
        value: String(users.length),
        icon: "user",
        iconColor: "primary",
      },
      {
        key: "active",
        label: t("auth.admin.dashboard.stat.active"),
        value: countByStatus(users, "active"),
        icon: "check",
        iconColor: "success",
      },
      {
        key: "pending",
        label: t("auth.admin.dashboard.stat.pending"),
        value: countByStatus(users, "pending_validation"),
        icon: "info",
        iconColor: "warning",
      },
      {
        key: "disabled",
        label: t("auth.admin.dashboard.stat.disabled"),
        value: countByStatus(users, "disabled"),
        icon: "cancel",
        iconColor: "secondary",
      },
    ],
    [users, t],
  );
}
