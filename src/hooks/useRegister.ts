import { CanopApiError, useTranslation } from "@canop/ui";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthPortal } from "../config/AuthPortalContext";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";
import { useNewPasswordValidation } from "./useNewPasswordValidation";

const UNPROCESSABLE_STATUS = 422;
const CONFLICT_STATUS = 409;

const TERMS_ERROR_KEYS: Readonly<Record<string, string>> = {
  terms_version_mismatch: "auth.register.terms.versionMismatch",
  terms_not_accepted: "auth.register.terms.required",
};

function termsErrorKey(err: unknown): string | null {
  if (!(err instanceof CanopApiError) || err.status !== UNPROCESSABLE_STATUS || !err.code) {
    return null;
  }
  return TERMS_ERROR_KEYS[err.code] ?? null;
}

function registerErrorKey(err: unknown): string {
  return err instanceof CanopApiError && err.status === CONFLICT_STATUS
    ? "auth.register.conflict"
    : "auth.register.error";
}

export function useRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { api, config } = useAuthPortal();
  const validateNewPassword = useNewPasswordValidation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function acceptTerms(checked: boolean) {
    setTermsAccepted(checked);
    if (checked) setTermsError(null);
  }

  function showRegisterError(err: unknown) {
    const termsKey = termsErrorKey(err);
    if (termsKey) {
      setTermsError(t(termsKey));
      return;
    }
    setError(t(registerErrorKey(err)));
  }

  function validate(): boolean {
    if (name.trim() === "") {
      setError(t("auth.register.nameRequired"));
      return false;
    }
    const passwordError = validateNewPassword(password, confirm);
    if (passwordError) {
      setError(passwordError);
      return false;
    }
    if (!termsAccepted) {
      setTermsError(t("auth.register.terms.required"));
      return false;
    }
    return true;
  }

  async function submit() {
    setError(null);
    setTermsError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await api.register({
        name: name.trim(),
        email,
        password,
        acceptedTermsVersion: config.terms.version,
      });
      navigate(AUTH_PORTAL_PATHS.login, { replace: true });
    } catch (err) {
      showRegisterError(err);
      setLoading(false);
    }
  }

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    termsAccepted,
    acceptTerms,
    termsError,
    submitDisabled: !termsAccepted,
    error,
    loading,
    submit,
  };
}
