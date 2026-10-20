import { CanopApiError, navigateTo, useTranslation } from "@canop/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthPortal } from "../config/AuthPortalContext";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";
import { usePostLoginTarget } from "./usePostLoginTarget";

const ACCOUNT_PENDING_CODE = "account_pending";

const LOGIN_ERROR_KEYS: Readonly<Record<string, string>> = {
  account_disabled: "auth.login.accountDisabled",
  device_not_allowed: "auth.login.deviceNotAllowed",
};

const DEFAULT_LOGIN_ERROR_KEY = "auth.login.error";

function errorCode(err: unknown): string | undefined {
  return err instanceof CanopApiError ? err.code : undefined;
}

function loginErrorKey(code: string | undefined): string {
  return (code && LOGIN_ERROR_KEYS[code]) || DEFAULT_LOGIN_ERROR_KEY;
}

export function useLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { api } = useAuthPortal();
  const postLoginTarget = usePostLoginTarget();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await api.login(email, password);
      navigateTo(postLoginTarget());
    } catch (err) {
      const code = errorCode(err);
      if (code === ACCOUNT_PENDING_CODE) {
        navigate(AUTH_PORTAL_PATHS.pending);
        return;
      }
      setError(t(loginErrorKey(code)));
      setLoading(false);
    }
  }

  return { email, setEmail, password, setPassword, error, loading, submit };
}
