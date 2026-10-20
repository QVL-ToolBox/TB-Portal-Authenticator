import { useAsyncResource } from "@canop/ui";
import type { AdminPortal } from "../api/adminApi";
import { useAdminApi } from "./useAdminApi";
import { useAdminErrorMessage } from "./useAdminErrorMessage";

const NO_PORTALS: AdminPortal[] = [];

export function usePortals() {
  const api = useAdminApi();
  const describeError = useAdminErrorMessage();
  const { data, loading, error, reload } = useAsyncResource<AdminPortal[]>({
    load: (signal) => api.listPortals(signal),
    initial: NO_PORTALS,
    toMessage: (err) => describeError(err, "auth.admin.portals.loadError"),
  });

  return { portals: data, loading, error, reload };
}
