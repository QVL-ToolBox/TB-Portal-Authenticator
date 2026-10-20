import { useTranslation } from "@canop/ui";
import { useCallback, useMemo } from "react";
import type { AdminUser } from "../api/adminApi";
import { distinctErrors } from "./distinctErrors";
import { useRegistrationSetting } from "./useRegistrationSetting";
import { useUsers } from "./useUsers";

function isPending(user: AdminUser): boolean {
  return user.status === "pending_validation";
}

export function useDashboardPage() {
  const { t } = useTranslation();
  const users = useUsers();
  const registration = useRegistrationSetting();
  const { notify, setStatus, remove } = users;
  const { toggle } = registration;

  const pendingUsers = useMemo(() => users.users.filter(isPending), [users.users]);

  const toggleRegistration = useCallback(
    async (enabled: boolean) => {
      const saved = await toggle(enabled);
      if (!saved) {
        notify("error", t("auth.admin.dashboard.registrationError"));
        return;
      }
      notify(
        "success",
        t(
          enabled
            ? "auth.admin.dashboard.registrationEnabled"
            : "auth.admin.dashboard.registrationDisabled",
        ),
      );
    },
    [notify, t, toggle],
  );

  const approve = useCallback(
    (user: AdminUser) => {
      void setStatus(user, "active");
    },
    [setStatus],
  );

  const reject = useCallback(
    (user: AdminUser) => {
      void remove(user);
    },
    [remove],
  );

  return {
    title: t("auth.admin.dashboard.title"),
    users: users.users,
    loading: users.loading,
    errors: distinctErrors([users.error]),
    pendingUsers,
    registrationEnabled: registration.enabled,
    registrationLocked: registration.loading || registration.saving,
    toggleRegistration,
    approve,
    reject,
    toast: users.toast,
    closeToast: users.closeToast,
  };
}
