import type { AdminRole } from "../api/adminApi";
import { distinctErrors } from "./distinctErrors";
import { useConfirmTarget } from "./useConfirmTarget";
import { usePortalRoleGroups } from "./usePortalRoleGroups";
import { usePortals } from "./usePortals";
import { useRoleDraft } from "./useRoleDraft";
import { useRoles } from "./useRoles";

export function useRolesPage() {
  const { portals, loading: portalsLoading, error: portalsError } = usePortals();
  const roles = useRoles();
  const groups = usePortalRoleGroups(portals, roles.roles);
  const draft = useRoleDraft(roles.create);
  const deletion = useConfirmTarget<AdminRole>(roles.remove);

  return {
    groups,
    portalsLoading,
    rolesLoading: roles.loading,
    isEmpty: !portalsLoading && portalsError === null && groups.length === 0,
    errors: distinctErrors([portalsError, roles.error]),
    draft,
    deletion,
    toast: roles.toast,
    closeToast: roles.closeToast,
  };
}
