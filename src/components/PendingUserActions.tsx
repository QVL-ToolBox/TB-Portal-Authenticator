import { ApproveButton, DeleteButton, Stack, useTranslation } from "@canop/ui";
import type { AdminUser } from "../api/adminApi";
import { COMPACT_ACTION_SIZE } from "./compactActionSize";

export interface PendingUserActionsProps {
  user: AdminUser;
  onApprove: (user: AdminUser) => void;
  onReject: (user: AdminUser) => void;
}

export function PendingUserActions({ user, onApprove, onReject }: PendingUserActionsProps) {
  const { t } = useTranslation();

  return (
    <Stack direction="row" gap="xs" justifyContent="end" wrap>
      <ApproveButton
        ariaLabel={t("auth.admin.dashboard.action.approve", { name: user.name })}
        size={COMPACT_ACTION_SIZE}
        onClick={() => onApprove(user)}
      />
      <DeleteButton
        ariaLabel={t("auth.admin.dashboard.action.reject", { name: user.name })}
        size={COMPACT_ACTION_SIZE}
        confirmTitle={t("auth.admin.dashboard.rejectTitle")}
        confirmMessage={t("auth.admin.users.deleteMessage")}
        confirmLabel={t("auth.admin.confirm")}
        cancelLabel={t("auth.admin.cancel")}
        onConfirm={() => onReject(user)}
      />
    </Stack>
  );
}
