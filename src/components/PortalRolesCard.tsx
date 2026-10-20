import { AddButton, Card, Stack, useTranslation } from "@canop/ui";
import type { AdminRole } from "../api/adminApi";
import type { PortalRoleGroup } from "../hooks/usePortalRoleGroups";
import type { RoleDraft } from "../hooks/useRoleDraft";
import { SubRoleDraftForm } from "./SubRoleDraftForm";
import { SubRoleList } from "./SubRoleList";

export interface PortalRolesCardProps {
  group: PortalRoleGroup;
  rolesLoading: boolean;
  draft: RoleDraft;
  onDelete: (role: AdminRole) => void;
}

export function PortalRolesCard({ group, rolesLoading, draft, onDelete }: PortalRolesCardProps) {
  const { t } = useTranslation();
  const portalName = group.portal.name;

  return (
    <Card
      title={group.label}
      subtitle={t("auth.admin.roles.portalRole", { role: portalName })}
      fill
    >
      <Stack gap="sm">
        <SubRoleList subRoles={group.subRoles} loading={rolesLoading} onDelete={onDelete} />
        {draft.portal === portalName ? (
          <SubRoleDraftForm draft={draft} />
        ) : (
          <AddButton
            ariaLabel={t("auth.admin.roles.addSubRole", { portal: group.label })}
            onClick={() => draft.start(portalName)}
          />
        )}
      </Stack>
    </Card>
  );
}
