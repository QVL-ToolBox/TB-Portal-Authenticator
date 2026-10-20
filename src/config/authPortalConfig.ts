import type {
  CanopLocale,
  CanopLocaleMessages,
  CanopMessages,
  CanopThemeProviderProps,
} from "@canop/ui";
import type { ComponentType, ReactNode } from "react";
import { mergeAuthPortalMessages } from "../i18n/mergeAuthPortalMessages";
import type { RedirectPolicy } from "../redirect/safeRedirect";
import { DEFAULT_API_BASE_PATH } from "./apiBasePathDefaults";
import { assertAuthPortalConfig } from "./assertAuthPortalConfig";
import { defaultCguSections, type CguSection } from "./cguSections";
import { resolveAuthPortalRedirect } from "./resolveAuthPortalRedirect";

export interface AuthPortalTerms {
  version: string;
  effectiveDate: string;
  services?: readonly string[];
  sections?: readonly CguSection[];
}

export type AuthPortalTheme = Omit<CanopThemeProviderProps, "children">;

export interface PortalLayoutProps {
  children: ReactNode;
}

export type PortalLayout = ComponentType<PortalLayoutProps>;

export interface AuthPortalBranding {
  logo?: ReactNode;
  header?: ReactNode;
  animatedShapes?: boolean;
  maxWidth?: string;
  showUtilities?: boolean;
  theme?: AuthPortalTheme;
  layout?: PortalLayout;
  footer?: ReactNode;
}

export interface AuthPortalRedirectConfig {
  trustedOrigins?: readonly string[];
  fallbackRedirect?: string;
  cookieName?: string;
  cookieDomain?: string;
}

export interface AuthPortalConfig {
  appName: string;
  terms: AuthPortalTerms;
  apiBasePath?: string;
  adminApiBasePath?: string;
  branding?: AuthPortalBranding;
  messages?: CanopLocaleMessages;
  defaultLocale?: CanopLocale;
  redirect?: AuthPortalRedirectConfig;
  admin?: boolean;
}

type AuthPortalLayoutBranding = Omit<AuthPortalBranding, "animatedShapes" | "theme">;

export interface ResolvedAuthPortalBranding extends AuthPortalLayoutBranding {
  animatedShapes: boolean;
  theme: AuthPortalTheme;
}

export interface ResolvedAuthPortalRedirect extends RedirectPolicy {
  cookieName: string;
  cookieDomain?: string;
}

export interface ResolvedAuthPortalConfig {
  appName: string;
  apiBasePath: string;
  adminApiBasePath: string;
  terms: Required<AuthPortalTerms>;
  branding: ResolvedAuthPortalBranding;
  defaultLocale: CanopLocale;
  messages: Record<CanopLocale, CanopMessages>;
  redirect: ResolvedAuthPortalRedirect;
  admin: boolean;
}

export const DEFAULT_TERMS_SERVICES: readonly string[] = ["authenticator"];

export const DEFAULT_LOCALE: CanopLocale = "fr";

export const DEFAULT_THEME: AuthPortalTheme = { defaultMode: "system" };

function resolveTerms(terms: AuthPortalTerms): Required<AuthPortalTerms> {
  const services = terms.services ?? DEFAULT_TERMS_SERVICES;
  return {
    version: terms.version,
    effectiveDate: terms.effectiveDate,
    services,
    sections: terms.sections ?? defaultCguSections(services),
  };
}

function resolveBranding(branding: AuthPortalBranding = {}): ResolvedAuthPortalBranding {
  return {
    ...branding,
    animatedShapes: branding.animatedShapes ?? true,
    theme: { ...DEFAULT_THEME, ...branding.theme },
  };
}

export function resolveAuthPortalConfig(config: AuthPortalConfig): ResolvedAuthPortalConfig {
  assertAuthPortalConfig(config);
  const apiBasePath = config.apiBasePath ?? DEFAULT_API_BASE_PATH;
  return {
    appName: config.appName,
    apiBasePath,
    adminApiBasePath: config.adminApiBasePath ?? apiBasePath,
    terms: resolveTerms(config.terms),
    branding: resolveBranding(config.branding),
    defaultLocale: config.defaultLocale ?? DEFAULT_LOCALE,
    messages: mergeAuthPortalMessages(config.messages),
    redirect: resolveAuthPortalRedirect(config.redirect),
    admin: config.admin ?? false,
  };
}
