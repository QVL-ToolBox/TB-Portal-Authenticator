import { useTranslation } from "@canop/ui";
import { useCallback } from "react";
import type { AdminUser } from "../api/adminApi";
import type { PortalRoleGroup } from "./usePortalRoleGroups";

export type UserPortalAccessLabeler = (user: AdminUser) => string;

export function useUserPortalAccess(groups: readonly PortalRoleGroup[]): UserPortalAccessLabeler {
  const { t } = useTranslation();

  return useCallback<UserPortalAccessLabeler>(
    (user) => {
      const labels = groups
        .filter((group) => user.roles.includes(group.portal.name))
        .map((group) => group.label);
      return labels.length > 0 ? labels.join(", ") : t("auth.admin.users.noPortalAccess");
    },
    [groups, t],
  );
}
