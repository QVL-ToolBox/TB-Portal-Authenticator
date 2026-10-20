import { invalidAuthPortalConfig } from "./AuthPortalConfigError";
import { assertCguSections } from "./assertCguSections";
import {
  assertOptionalApiBasePath,
  assertOptionalBoolean,
  assertOptionalComponent,
  assertOptionalLocale,
  assertOptionalObject,
  assertRequiredName,
  displayValue,
  isNonBlankString,
} from "./configAssertions";
import type { AuthPortalBranding, AuthPortalConfig, AuthPortalTerms } from "./authPortalConfig";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: unknown): boolean {
  return (
    typeof value === "string" &&
    ISO_DATE_PATTERN.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().startsWith(value)
  );
}

function isStringList(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function assertBranding(branding: AuthPortalBranding | undefined): void {
  assertOptionalObject(branding, "branding");
  assertOptionalObject(branding?.theme, "branding.theme");
  assertOptionalBoolean(branding?.animatedShapes, "branding.animatedShapes");
  assertOptionalComponent(branding?.layout, "branding.layout");
}

function assertTerms(terms: AuthPortalTerms | null | undefined): void {
  if (terms === null || typeof terms !== "object") {
    invalidAuthPortalConfig("terms est requis");
  }
  if (terms.services !== undefined && !isStringList(terms.services)) {
    invalidAuthPortalConfig("terms.services doit etre une liste de chaines");
  }
  assertCguSections(terms.sections);
  if (!isNonBlankString(terms.version)) {
    invalidAuthPortalConfig("terms.version est requis");
  }
  if (!isIsoDate(terms.effectiveDate)) {
    invalidAuthPortalConfig(
      `terms.effectiveDate doit etre une date AAAA-MM-JJ valide : "${displayValue(terms.effectiveDate)}"`,
    );
  }
}

export function assertAuthPortalConfig(
  config: AuthPortalConfig | null | undefined,
): asserts config is AuthPortalConfig {
  if (config === null || typeof config !== "object") {
    invalidAuthPortalConfig("la config est requise");
  }
  assertRequiredName(config.appName, "appName");
  assertTerms(config.terms);
  assertBranding(config.branding);
  assertOptionalObject(config.messages, "messages");
  assertOptionalObject(config.redirect, "redirect");
  assertOptionalApiBasePath(config.apiBasePath, "apiBasePath");
  assertOptionalApiBasePath(config.adminApiBasePath, "adminApiBasePath");
  assertOptionalBoolean(config.admin, "admin");
  assertOptionalLocale(config.defaultLocale);
}
