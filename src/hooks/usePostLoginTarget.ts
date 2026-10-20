import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuthPortal } from "../config/AuthPortalContext";
import { consumeRedirectCookie } from "../redirect/redirectCookie";
import { resolvePostLoginTarget } from "../redirect/resolvePostLoginTarget";

export function usePostLoginTarget(): () => string {
  const { config } = useAuthPortal();
  const { search } = useLocation();
  const { redirect } = config;

  return useCallback(() => {
    const cookieTarget = consumeRedirectCookie(redirect.cookieName, redirect.cookieDomain);
    return resolvePostLoginTarget({ search, cookieTarget }, redirect);
  }, [redirect, search]);
}
