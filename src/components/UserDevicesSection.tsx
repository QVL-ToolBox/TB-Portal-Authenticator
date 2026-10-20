import { Presence, PresenceItem, Stack, Text, Toggle, useTranslation } from "@canop/ui";
import type { UserEditor } from "../hooks/useUserEditor";
import { UserDeviceItem } from "./UserDeviceItem";

export interface UserDevicesSectionProps {
  editor: UserEditor;
}

export function UserDevicesSection({ editor }: UserDevicesSectionProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="md">
        <Text weight="medium">{t("auth.admin.users.whitelistOnly")}</Text>
        <Toggle
          checked={editor.whitelistOnly}
          onChange={(enabled) => void editor.setWhitelistOnly(enabled)}
          color="primary"
          disabled={!editor.canToggleWhitelist}
          ariaLabel={t("auth.admin.users.whitelistOnly")}
        />
      </Stack>
      {editor.showWhitelistHint && (
        <Text variant="body-sm" tone="muted">
          {t("auth.admin.users.whitelistNeedsDevice")}
        </Text>
      )}
      <Stack gap="sm">
        <Text weight="medium">{t("auth.admin.users.devices")}</Text>
        {editor.devices.length === 0 ? (
          <Text tone="muted">{t("auth.admin.users.noDevices")}</Text>
        ) : (
          <Stack gap="xs" role="list">
            <Presence>
              {editor.devices.map((device) => (
                <PresenceItem key={device.id} role="listitem" layout>
                  <UserDeviceItem
                    device={device}
                    canRevoke={editor.canRevokeDevice}
                    onRevoke={(deviceId) => void editor.revokeDevice(deviceId)}
                  />
                </PresenceItem>
              ))}
            </Presence>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
