import { useAsyncResource } from "@canop/ui";
import type { AdminRole } from "../api/adminApi";
import { useAdminApi } from "./useAdminApi";
import { useAdminErrorMessage } from "./useAdminErrorMessage";

const NO_ROLES: AdminRole[] = [];

export function useRoleCatalogue() {
  const api = useAdminApi();
  const describeError = useAdminErrorMessage();
  const { data, loading, error, reload } = useAsyncResource<AdminRole[]>({
    load: (signal) => api.listRoles(signal),
    initial: NO_ROLES,
    toMessage: (err) => describeError(err, "auth.admin.roles.loadError"),
  });

  return { roles: data, loading, error, reload };
}
