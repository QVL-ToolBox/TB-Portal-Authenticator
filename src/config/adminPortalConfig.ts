import type { CanopLocale, CanopLocaleMessages, CanopMessages } from "@canop/ui";
import type { ReactNode } from "react";
import { mergeAuthPortalMessages } from "../i18n/mergeAuthPortalMessages";
import { parseTrustedOrigin } from "../redirect/trustedOrigins";
import { DEFAULT_ADMIN_API_BASE_PATH, DEFAULT_API_BASE_PATH } from "./apiBasePathDefaults";
import { invalidAuthPortalConfig } from "./AuthPortalConfigError";
import { assertAdminPortalConfig } from "./assertAdminPortalConfig";
import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  type AuthPortalTheme,
  type PortalLayout,
} from "./authPortalConfig";
import {
  DEFAULT_REDIRECT_COOKIE_NAME,
  resolveCookieDomain,
  resolveCookieName,
} from "./resolveAuthPortalRedirect";

export const DEFAULT_ADMIN_ROLE = "admin";

export interface AdminPortalBranding {
  theme?: AuthPortalTheme;
  footer?: ReactNode;
}

export interface AdminPortalRedirectConfig {
  cookieName?: string;
  cookieDomain?: string;
}

export interface AdminPortalConfig {
  appName: string;
  authPortalUrl: string;
  apiBasePath?: string;
  adminApiBasePath?: string;
  adminRole?: string;
  branding?: AdminPortalBranding;
  adminLayout?: PortalLayout;
  messages?: CanopLocaleMessages;
  defaultLocale?: CanopLocale;
  redirect?: AdminPortalRedirectConfig;
}

export interface ResolvedAdminPortalBranding {
  theme: AuthPortalTheme;
  footer?: ReactNode;
}

export interface ResolvedAdminPortalRedirect {
  cookieName: string;
  cookieDomain?: string;
}

export interface ResolvedAdminPortalConfig {
  appName: string;
  authPortalUrl: string;
  apiBasePath: string;
  adminApiBasePath: string;
  adminRole: string;
  branding: ResolvedAdminPortalBranding;
  adminLayout?: PortalLayout;
  defaultLocale: CanopLocale;
  messages: Record<CanopLocale, CanopMessages>;
  redirect: ResolvedAdminPortalRedirect;
}

function resolveAuthPortalUrl(authPortalUrl: string): string {
  const origin = parseTrustedOrigin(authPortalUrl);
  if (origin === null) {
    invalidAuthPortalConfig(
      `authPortalUrl doit etre une origine http(s), sans identifiants ni chemin : "${authPortalUrl}"`,
    );
  }
  return origin;
}

function resolveBranding(branding: AdminPortalBranding = {}): ResolvedAdminPortalBranding {
  return { ...branding, theme: { ...DEFAULT_THEME, ...branding.theme } };
}

function resolveRedirect(redirect: AdminPortalRedirectConfig = {}): ResolvedAdminPortalRedirect {
  return {
    cookieName: resolveCookieName(redirect.cookieName ?? DEFAULT_REDIRECT_COOKIE_NAME),
    cookieDomain: resolveCookieDomain(redirect.cookieDomain),
  };
}

export function resolveAdminPortalConfig(config: AdminPortalConfig): ResolvedAdminPortalConfig {
  assertAdminPortalConfig(config);
  return {
    appName: config.appName,
    authPortalUrl: resolveAuthPortalUrl(config.authPortalUrl),
    apiBasePath: config.apiBasePath ?? DEFAULT_API_BASE_PATH,
    adminApiBasePath: config.adminApiBasePath ?? DEFAULT_ADMIN_API_BASE_PATH,
    adminRole: config.adminRole ?? DEFAULT_ADMIN_ROLE,
    branding: resolveBranding(config.branding),
    adminLayout: config.adminLayout,
    defaultLocale: config.defaultLocale ?? DEFAULT_LOCALE,
    messages: mergeAuthPortalMessages(config.messages),
    redirect: resolveRedirect(config.redirect),
  };
}
