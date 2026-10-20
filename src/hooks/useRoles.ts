import { useTranslation } from "@canop/ui";
import { useCallback } from "react";
import type { AdminRole, CreateRolePayload } from "../api/adminApi";
import { useAdminAction } from "./useAdminAction";
import { useAdminApi } from "./useAdminApi";
import { useAdminToast } from "./useAdminToast";
import { useRoleCatalogue } from "./useRoleCatalogue";

export function useRoles() {
  const { t } = useTranslation();
  const api = useAdminApi();
  const catalogue = useRoleCatalogue();
  const { toast, notify, closeToast } = useAdminToast();
  const run = useAdminAction(notify, catalogue.reload);

  const create = useCallback(
    (payload: CreateRolePayload) =>
      run(() => api.createRole(payload), t("auth.admin.roles.created", { name: payload.name })),
    [api, run, t],
  );

  const remove = useCallback(
    (role: AdminRole) =>
      run(() => api.deleteRole(role.id), t("auth.admin.roles.deleted", { name: role.name })),
    [api, run, t],
  );

  return {
    roles: catalogue.roles,
    loading: catalogue.loading,
    error: catalogue.error,
    toast,
    closeToast,
    create,
    remove,
  };
}
