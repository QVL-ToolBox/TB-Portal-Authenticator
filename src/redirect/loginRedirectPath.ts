import { REDIRECT_INTENT_PARAM } from "@canop/ui";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function loginRedirectPath(target: string = AUTH_PORTAL_PATHS.account): string {
  const params = new URLSearchParams({ [REDIRECT_INTENT_PARAM]: target });
  return `${AUTH_PORTAL_PATHS.login}?${params.toString()}`;
}
