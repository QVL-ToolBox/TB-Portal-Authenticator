import { Card, DataTable, useTranslation } from "@canop/ui";
import type { AdminUser } from "../api/adminApi";
import { usePendingUsersColumns } from "../hooks/usePendingUsersColumns";
import { PendingUserActions } from "./PendingUserActions";

export interface PendingUsersCardProps {
  users: AdminUser[];
  loading: boolean;
  onApprove: (user: AdminUser) => void;
  onReject: (user: AdminUser) => void;
}

function pendingUserKey(user: AdminUser): string {
  return user.user_id;
}

export function PendingUsersCard({ users, loading, onApprove, onReject }: PendingUsersCardProps) {
  const { t } = useTranslation();
  const columns = usePendingUsersColumns();

  return (
    <Card title={t("auth.admin.dashboard.pendingTitle")}>
      <DataTable
        columns={columns}
        rows={users}
        getRowKey={pendingUserKey}
        loading={loading}
        emptyMessage={t("auth.admin.dashboard.pendingEmpty")}
        stickyHeader
        animated
        enableKeyboardNav
        actionsHeader={t("auth.admin.dashboard.col.actions")}
        actions={(user) => (
          <PendingUserActions user={user} onApprove={onApprove} onReject={onReject} />
        )}
      />
    </Card>
  );
}
