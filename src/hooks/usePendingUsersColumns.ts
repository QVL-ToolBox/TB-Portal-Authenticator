import { useTranslation, type CanopColumn } from "@canop/ui";
import { useMemo } from "react";
import type { AdminUser } from "../api/adminApi";

export function usePendingUsersColumns(): CanopColumn<AdminUser>[] {
  const { t } = useTranslation();

  return useMemo<CanopColumn<AdminUser>[]>(
    () => [{ key: "name", header: t("auth.admin.users.col.name"), sortable: true }],
    [t],
  );
}
