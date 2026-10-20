import { Stack, StatusChip, Text, useTranslation, type CanopStatusTone } from "@canop/ui";
import type { AccountStatus } from "../api/adminApi";

const STATUS_TONES: Readonly<Record<AccountStatus, CanopStatusTone>> = {
  active: "success",
  pending_validation: "warning",
  disabled: "error",
};

export interface UserStatusLineProps {
  status: AccountStatus;
}

export function UserStatusLine({ status }: UserStatusLineProps) {
  const { t } = useTranslation();

  return (
    <Stack direction="row" alignItems="center" gap="sm">
      <Text weight="medium">{t("auth.admin.users.status")}</Text>
      <StatusChip tone={STATUS_TONES[status]} label={t(`auth.admin.status.${status}`)} />
    </Stack>
  );
}
