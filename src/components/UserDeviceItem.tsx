import { Card, IconActionButton, Stack, Text, useTranslation } from "@canop/ui";
import type { AdminUserDevice } from "../api/adminApi";
import { useFormattedDate } from "../hooks/useFormattedDate";
import { COMPACT_ACTION_SIZE } from "./compactActionSize";

export interface UserDeviceItemProps {
  device: AdminUserDevice;
  canRevoke: boolean;
  onRevoke: (deviceId: string) => void;
}

export function UserDeviceItem({ device, canRevoke, onRevoke }: UserDeviceItemProps) {
  const { t } = useTranslation();
  const lastSeen = useFormattedDate(device.last_seen);
  const label = device.label || t("auth.admin.users.unknownDevice");

  return (
    <Card density="dense" elevation="none" radius="md">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="sm">
        <Stack gap="xs" fill>
          <Text weight="medium">{label}</Text>
          <Text variant="body-sm" tone="muted">
            {t("auth.admin.users.deviceLastSeen", { date: lastSeen })}
          </Text>
          {device.last_ip && (
            <Text variant="code" tone="muted">
              {device.last_ip}
            </Text>
          )}
        </Stack>
        {canRevoke && (
          <IconActionButton
            icon="close"
            variant="secondary"
            size={COMPACT_ACTION_SIZE}
            iconSize="sm"
            ariaLabel={t("auth.admin.users.revokeDevice", { label })}
            onClick={() => onRevoke(device.id)}
          />
        )}
      </Stack>
    </Card>
  );
}
