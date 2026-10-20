import { Stack, Text, useTranslation } from "@canop/ui";
import type { PortalRoleGroup } from "../hooks/usePortalRoleGroups";
import { UserPortalRolesGroup } from "./UserPortalRolesGroup";

export interface UserRolesEditorProps {
  groups: readonly PortalRoleGroup[];
  roles: readonly string[];
  onToggleRole: (roleName: string) => void;
}

export function UserRolesEditor({ groups, roles, onToggleRole }: UserRolesEditorProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="sm">
      <Text weight="medium">{t("auth.admin.users.rolesLegend")}</Text>
      {groups.map((group) => (
        <UserPortalRolesGroup
          key={group.portal.name}
          group={group}
          roles={roles}
          onToggleRole={onToggleRole}
        />
      ))}
    </Stack>
  );
}
