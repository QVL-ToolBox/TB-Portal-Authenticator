import { DataTable, Legend, Stack, useTranslation } from "@canop/ui";
import { memo } from "react";
import type { AdminUser } from "../api/adminApi";
import { useUsersTable } from "../hooks/useUsersTable";

const DISABLED_ROW_SX = { opacity: 0.55 };
const PENDING_ROW_SX = {
  "& td": {
    backgroundColor: "warning.main",
    color: "warning.contrastText",
    borderBottom: "none",
  },
};
const DEFAULT_ROW_SX = {};

function userRowSx(user: AdminUser): Record<string, unknown> {
  if (user.status === "disabled") return DISABLED_ROW_SX;
  if (user.status === "pending_validation") return PENDING_ROW_SX;
  return DEFAULT_ROW_SX;
}

function userRowKey(user: AdminUser): string {
  return user.user_id;
}

export interface UsersTableProps {
  users: AdminUser[];
  loading: boolean;
  portalAccessLabel: (user: AdminUser) => string;
  onToggleActive: (user: AdminUser, active: boolean) => void;
  onEdit: (user: AdminUser) => void;
}

export const UsersTable = memo(function UsersTable({
  users,
  loading,
  portalAccessLabel,
  onToggleActive,
  onEdit,
}: UsersTableProps) {
  const { t } = useTranslation();
  const { columns, legendItems } = useUsersTable(portalAccessLabel, onToggleActive);

  return (
    <Stack gap="md" fill>
      <Legend items={legendItems} />
      <DataTable
        columns={columns}
        rows={users}
        getRowKey={userRowKey}
        loading={loading}
        emptyMessage={t("auth.admin.users.empty")}
        fixedLayout
        stickyHeader
        fillHeight
        animated
        enableKeyboardNav
        editable
        onRowEdit={onEdit}
        onRowActivate={onEdit}
        editLabel={t("auth.admin.users.action.edit")}
        actionsWidth="10%"
        rowSx={userRowSx}
      />
    </Stack>
  );
});
