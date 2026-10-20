import { useAsyncResource, useTranslation } from "@canop/ui";
import { useCallback } from "react";
import type { AccountStatus, AdminUser, UpdateUserPayload } from "../api/adminApi";
import { useAdminAction } from "./useAdminAction";
import { useAdminApi } from "./useAdminApi";
import { useAdminErrorMessage } from "./useAdminErrorMessage";
import { useAdminToast } from "./useAdminToast";

const USERS_LIMIT = 100;
const NO_USERS: AdminUser[] = [];
const KEEP_LOADED_USERS = (): void => undefined;
const STATUS_CHANGE_KEYS: Readonly<Record<AccountStatus, string>> = {
  active: "auth.admin.users.activated",
  disabled: "auth.admin.users.disabled",
  pending_validation: "auth.admin.users.markedPending",
};

export function useUsers() {
  const { t } = useTranslation();
  const api = useAdminApi();
  const describeError = useAdminErrorMessage();
  const { toast, notify, closeToast } = useAdminToast();
  const { data, loading, error, reload } = useAsyncResource<AdminUser[]>({
    load: async (signal) => (await api.listUsers({ limit: USERS_LIMIT }, signal)).users,
    initial: NO_USERS,
    toMessage: (err) => describeError(err, "auth.admin.users.loadError"),
  });
  const run = useAdminAction(notify, reload);
  const runWithoutReload = useAdminAction(notify, KEEP_LOADED_USERS);

  const setStatus = useCallback(
    (user: AdminUser, status: AccountStatus) =>
      run(
        () => api.updateUserStatus(user.user_id, status),
        t(STATUS_CHANGE_KEYS[status], { name: user.name }),
      ),
    [api, run, t],
  );

  const editUser = useCallback(
    (id: string, payload: UpdateUserPayload) => runWithoutReload(() => api.updateUser(id, payload)),
    [api, runWithoutReload],
  );

  const assignRoles = useCallback(
    (id: string, roles: string[]) => runWithoutReload(() => api.updateUserRoles(id, roles)),
    [api, runWithoutReload],
  );

  const changePassword = useCallback(
    (id: string, password: string) => runWithoutReload(() => api.updateUserPassword(id, password)),
    [api, runWithoutReload],
  );

  const updateWhitelist = useCallback(
    (id: string, whitelistOnly: boolean) => run(() => api.updateUserWhitelist(id, whitelistOnly)),
    [api, run],
  );

  const revokeDevice = useCallback(
    (id: string, deviceId: string) => run(() => api.revokeUserDevice(id, deviceId)),
    [api, run],
  );

  const remove = useCallback(
    (user: AdminUser) =>
      run(() => api.deleteUser(user.user_id), t("auth.admin.users.deleted", { name: user.name })),
    [api, run, t],
  );

  const notifyUpdated = useCallback(
    (name: string) => notify("success", t("auth.admin.users.updated", { name })),
    [notify, t],
  );

  const notifyUnsaved = useCallback(
    () => notify("info", t("auth.admin.users.unsavedChanges")),
    [notify, t],
  );

  return {
    users: data,
    loading,
    error,
    reload,
    toast,
    notify,
    closeToast,
    setStatus,
    editUser,
    assignRoles,
    changePassword,
    updateWhitelist,
    revokeDevice,
    remove,
    notifyUpdated,
    notifyUnsaved,
  };
}

export type UsersResource = ReturnType<typeof useUsers>;
