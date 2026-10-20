import { useCallback } from "react";
import type { AdminNotifier } from "./useAdminToast";
import { useAdminErrorMessage } from "./useAdminErrorMessage";

export type AdminActionRunner = (
  action: () => Promise<unknown>,
  successMessage?: string,
) => Promise<boolean>;

export function useAdminAction(notify: AdminNotifier, onSuccess: () => void): AdminActionRunner {
  const describeError = useAdminErrorMessage();

  return useCallback<AdminActionRunner>(
    async (action, successMessage) => {
      try {
        await action();
        if (successMessage) notify("success", successMessage);
        onSuccess();
        return true;
      } catch (err) {
        notify("error", describeError(err, "auth.admin.actionError"));
        return false;
      }
    },
    [describeError, notify, onSuccess],
  );
}
