import { isValidCookieDomain, isValidCookieName } from "../redirect/redirectCookie";
import { validateRedirectTarget } from "../redirect/safeRedirect";
import { parseTrustedOrigin } from "../redirect/trustedOrigins";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";
import { invalidAuthPortalConfig } from "./AuthPortalConfigError";
import type { AuthPortalRedirectConfig, ResolvedAuthPortalRedirect } from "./authPortalConfig";

export const DEFAULT_FALLBACK_REDIRECT = AUTH_PORTAL_PATHS.account;

export const DEFAULT_REDIRECT_COOKIE_NAME = "auth_redirect";

function resolveTrustedOrigin(origin: string): string {
  const parsed = parseTrustedOrigin(origin);
  if (parsed === null) {
    invalidAuthPortalConfig(
      `origine de confiance invalide (http/https, sans identifiants ni chemin) : "${origin}"`,
    );
  }
  return parsed;
}

function resolveTrustedOrigins(origins: readonly string[]): readonly string[] {
  if (!Array.isArray(origins)) {
    invalidAuthPortalConfig("redirect.trustedOrigins doit etre une liste");
  }
  const filled = origins.map((origin) => String(origin).trim()).filter(Boolean);
  return [...new Set(filled.map(resolveTrustedOrigin))];
}

function resolveFallbackRedirect(fallback: string, trustedOrigins: readonly string[]): string {
  const validated = validateRedirectTarget(fallback, trustedOrigins);
  if (validated === null) {
    invalidAuthPortalConfig(
      `redirect.fallbackRedirect invalide ou hors des origines de confiance : "${fallback}"`,
    );
  }
  return validated;
}

export function resolveCookieName(cookieName: string): string {
  if (!isValidCookieName(cookieName)) {
    invalidAuthPortalConfig(
      `redirect.cookieName invalide (lettres, chiffres, "_" ou "-", sans prefixe __Host-/__Secure-) : "${cookieName}"`,
    );
  }
  return cookieName;
}

export function resolveCookieDomain(cookieDomain: string | undefined): string | undefined {
  if (cookieDomain !== undefined && !isValidCookieDomain(cookieDomain)) {
    invalidAuthPortalConfig(`redirect.cookieDomain invalide : "${cookieDomain}"`);
  }
  return cookieDomain;
}

export function resolveAuthPortalRedirect(
  redirect: AuthPortalRedirectConfig = {},
): ResolvedAuthPortalRedirect {
  const trustedOrigins = resolveTrustedOrigins(redirect.trustedOrigins ?? []);
  return {
    trustedOrigins,
    fallbackRedirect: resolveFallbackRedirect(
      redirect.fallbackRedirect ?? DEFAULT_FALLBACK_REDIRECT,
      trustedOrigins,
    ),
    cookieName: resolveCookieName(redirect.cookieName ?? DEFAULT_REDIRECT_COOKIE_NAME),
    cookieDomain: resolveCookieDomain(redirect.cookieDomain),
  };
}
