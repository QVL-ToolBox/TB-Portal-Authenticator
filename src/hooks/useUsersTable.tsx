import { useTranslation, type CanopLegendEntry } from "@canop/ui";
import { useMemo } from "react";
import type { AdminUser } from "../api/adminApi";
import { useUsersTableColumns } from "./useUsersTableColumns";

export function useUsersTable(
  portalAccessLabel: (user: AdminUser) => string,
  onToggleActive: (user: AdminUser, active: boolean) => void,
) {
  const { t } = useTranslation();
  const columns = useUsersTableColumns(portalAccessLabel, onToggleActive);
  const legendItems = useMemo<CanopLegendEntry[]>(
    () => [
      { tone: "warning", label: t("auth.admin.status.pending_validation") },
      { tone: "neutral", label: t("auth.admin.status.disabled") },
    ],
    [t],
  );

  return { columns, legendItems };
}
