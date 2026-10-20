import { BulletList, IconActionButton, Skeleton, Text, useTranslation } from "@canop/ui";
import type { AdminRole } from "../api/adminApi";
import { COMPACT_ACTION_SIZE } from "./compactActionSize";

export interface SubRoleListProps {
  subRoles: readonly AdminRole[];
  loading: boolean;
  onDelete: (role: AdminRole) => void;
}

export function SubRoleList({ subRoles, loading, onDelete }: SubRoleListProps) {
  const { t } = useTranslation();

  if (loading) return <Skeleton variant="lines" lines={2} />;
  if (subRoles.length === 0) {
    return (
      <Text variant="body-sm" tone="muted">
        {t("auth.admin.roles.noSubRoles")}
      </Text>
    );
  }

  return (
    <BulletList
      items={subRoles.map((role) => ({
        key: role.id,
        content: role.name,
        action: (
          <IconActionButton
            icon="trash"
            variant="danger"
            size={COMPACT_ACTION_SIZE}
            iconSize="sm"
            ariaLabel={t("auth.admin.roles.deleteSubRole", { name: role.name })}
            onClick={() => onDelete(role)}
          />
        ),
      }))}
    />
  );
}
