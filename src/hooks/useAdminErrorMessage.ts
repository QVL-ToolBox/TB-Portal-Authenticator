import { isUnauthorized, useTranslation } from "@canop/ui";
import { useCallback } from "react";
import { adminErrorMessage } from "../api/adminErrors";
import { useUnauthorizedRedirect } from "./useUnauthorizedRedirect";

export type AdminErrorDescriber = (err: unknown, fallbackKey: string) => string;

export function useAdminErrorMessage(): AdminErrorDescriber {
  const { t } = useTranslation();
  const redirectUnauthorized = useUnauthorizedRedirect();

  return useCallback<AdminErrorDescriber>(
    (err, fallbackKey) => {
      if (isUnauthorized(err)) redirectUnauthorized();
      return adminErrorMessage(t, err, fallbackKey);
    },
    [redirectUnauthorized, t],
  );
}
