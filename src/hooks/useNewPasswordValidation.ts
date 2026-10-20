import { PASSWORD_MIN_LENGTH, useTranslation } from "@canop/ui";
import { useCallback } from "react";

export function useNewPasswordValidation(): (password: string, confirm: string) => string | null {
  const { t } = useTranslation();

  return useCallback(
    (password: string, confirm: string) => {
      if (password !== confirm) return t("auth.passwordMismatch");
      if (password.length < PASSWORD_MIN_LENGTH) {
        return t("canop.validation.passwordMin", { min: PASSWORD_MIN_LENGTH });
      }
      return null;
    },
    [t],
  );
}
