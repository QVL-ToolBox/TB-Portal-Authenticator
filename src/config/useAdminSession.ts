import { buildCguUrl, buildLoginUrl } from "@canop/ui";
import { useCallback, useMemo } from "react";
import { useLoginRedirect } from "../hooks/useLoginRedirect";
import type { AdminSession } from "./AdminPortalContext";
import type { ResolvedAdminPortalConfig } from "./adminPortalConfig";

export function useAdminSession({
  authPortalUrl,
  redirect,
}: ResolvedAdminPortalConfig): AdminSession {
  const { cookieName, cookieDomain } = redirect;

  const loginUrl = useCallback(
    () =>
      buildLoginUrl({
        authPortalUrl,
        redirectCookieName: cookieName,
        redirectCookieDomain: cookieDomain,
      }),
    [authPortalUrl, cookieName, cookieDomain],
  );

  const cguUrl = useCallback(
    (legalNoticeAnchor?: string) => buildCguUrl({ authPortalUrl, legalNoticeAnchor }),
    [authPortalUrl],
  );

  const redirectToLogin = useLoginRedirect(loginUrl);

  return useMemo(
    () => ({ loginUrl, cguUrl, redirectToLogin }),
    [loginUrl, cguUrl, redirectToLogin],
  );
}
