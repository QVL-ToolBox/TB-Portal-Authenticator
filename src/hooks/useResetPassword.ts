import { useTranslation } from "@canop/ui";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthPortal } from "../config/AuthPortalContext";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";
import { useNewPasswordValidation } from "./useNewPasswordValidation";

const TOKEN_PARAM = "token";

export function useResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api } = useAuthPortal();
  const validateNewPassword = useNewPasswordValidation();
  const token = searchParams.get(TOKEN_PARAM) ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const validationError = validateNewPassword(password, confirm);
    setError(validationError);
    if (validationError) return;
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      navigate(AUTH_PORTAL_PATHS.login, { replace: true });
    } catch {
      setError(t("auth.reset.error"));
      setLoading(false);
    }
  }

  return { token, password, setPassword, confirm, setConfirm, error, loading, submit };
}
