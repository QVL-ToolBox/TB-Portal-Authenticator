import { REDIRECT_INTENT_PARAM } from "@canop/ui";
import { safeRedirect, type RedirectPolicy } from "./safeRedirect";

export const COOKIE_REDIRECT_INTENT = "1";

export interface PostLoginRedirectSources {
  search: string;
  cookieTarget: string | null;
}

export function getRedirectTarget({
  search,
  cookieTarget,
}: PostLoginRedirectSources): string | null {
  const intent = new URLSearchParams(search).get(REDIRECT_INTENT_PARAM);
  if (!intent) return null;
  return intent === COOKIE_REDIRECT_INTENT ? cookieTarget : intent;
}

export function resolvePostLoginTarget(
  sources: PostLoginRedirectSources,
  policy: RedirectPolicy,
): string {
  return safeRedirect(getRedirectTarget(sources), policy);
}
