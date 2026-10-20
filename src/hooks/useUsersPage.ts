import { useCallback } from "react";
import type { AdminUser } from "../api/adminApi";
import { distinctErrors } from "./distinctErrors";
import { usePortalRoleGroups } from "./usePortalRoleGroups";
import { usePortals } from "./usePortals";
import { useRoleCatalogue } from "./useRoleCatalogue";
import { useToastLayer } from "./useToastLayer";
import { useUserEditor } from "./useUserEditor";
import { useUserPortalAccess } from "./useUserPortalAccess";
import { useUsers } from "./useUsers";

export function useUsersPage() {
  const users = useUsers();
  const portals = usePortals();
  const catalogue = useRoleCatalogue();
  const groups = usePortalRoleGroups(portals.portals, catalogue.roles);
  const editor = useUserEditor(users);
  const portalAccessLabel = useUserPortalAccess(groups);
  const toastInPanel = useToastLayer(users.toast, editor.open);
  const { setStatus } = users;

  const toggleActive = useCallback(
    (user: AdminUser, active: boolean) => {
      void setStatus(user, active ? "active" : "disabled");
    },
    [setStatus],
  );

  return {
    users: users.users,
    loading: users.loading,
    errors: distinctErrors([users.error, portals.error, catalogue.error]),
    groups,
    editor,
    portalAccessLabel,
    toggleActive,
    toast: users.toast,
    toastInPanel,
    closeToast: users.closeToast,
  };
}
