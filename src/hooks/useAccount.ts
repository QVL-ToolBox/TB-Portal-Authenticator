import { isUnauthorized, useTranslation } from "@canop/ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Me } from "../api/authApi";
import { useAuthPortal } from "../config/AuthPortalContext";
import { loginRedirectPath } from "../redirect/loginRedirectPath";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function useAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { api } = useAuthPortal();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    api
      .getMe(signal)
      .then((profile) => {
        if (!signal.aborted) setMe(profile);
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        if (isUnauthorized(err)) {
          navigate(loginRedirectPath(), { replace: true });
          return;
        }
        setError(t("auth.account.loadError"));
      });

    return () => controller.abort();
  }, [api, navigate, t]);

  async function signOut() {
    await api.logout().catch(() => undefined);
    navigate(AUTH_PORTAL_PATHS.login, { replace: true });
  }

  return { me, error, signOut };
}
