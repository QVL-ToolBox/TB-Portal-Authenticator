import { Card, Checkbox, Stack, Text, Toggle, useTranslation } from "@canop/ui";
import type { PortalRoleGroup } from "../hooks/usePortalRoleGroups";

export interface UserPortalRolesGroupProps {
  group: PortalRoleGroup;
  roles: readonly string[];
  onToggleRole: (roleName: string) => void;
}

export function UserPortalRolesGroup({ group, roles, onToggleRole }: UserPortalRolesGroupProps) {
  const { t } = useTranslation();
  const portalName = group.portal.name;

  return (
    <Card density="dense" elevation="none" radius="md">
      <Stack gap="sm">
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap="md">
          <Text weight="semibold">{group.label}</Text>
          <Toggle
            checked={roles.includes(portalName)}
            onChange={() => onToggleRole(portalName)}
            color="primary"
            label={t("auth.admin.users.portalAccess")}
            ariaLabel={t("auth.admin.users.portalAccessFor", { portal: group.label })}
          />
        </Stack>
        {group.subRoles.length > 0 && (
          <Stack gap="xs">
            <Text variant="body-sm" tone="muted">
              {t("auth.admin.users.subRoles")}
            </Text>
            {group.subRoles.map((role) => (
              <Checkbox
                key={role.id}
                checked={roles.includes(role.name)}
                onChange={() => onToggleRole(role.name)}
                label={role.name}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
