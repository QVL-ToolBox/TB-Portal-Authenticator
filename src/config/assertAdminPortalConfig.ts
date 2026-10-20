import { invalidAuthPortalConfig } from "./AuthPortalConfigError";
import type { AdminPortalConfig } from "./adminPortalConfig";
import {
  assertOptionalApiBasePath,
  assertOptionalComponent,
  assertOptionalLocale,
  assertOptionalObject,
  assertRequiredName,
  displayValue,
  isNonBlankString,
} from "./configAssertions";

function assertOptionalName(value: unknown, key: string): void {
  if (value !== undefined && !isNonBlankString(value)) {
    invalidAuthPortalConfig(`${key} doit etre une chaine non vide : "${displayValue(value)}"`);
  }
}

export function assertAdminPortalConfig(
  config: AdminPortalConfig | null | undefined,
): asserts config is AdminPortalConfig {
  if (config === null || typeof config !== "object") {
    invalidAuthPortalConfig("la config est requise");
  }
  assertRequiredName(config.appName, "appName");
  assertRequiredName(config.authPortalUrl, "authPortalUrl");
  assertOptionalApiBasePath(config.apiBasePath, "apiBasePath");
  assertOptionalApiBasePath(config.adminApiBasePath, "adminApiBasePath");
  assertOptionalName(config.adminRole, "adminRole");
  assertOptionalObject(config.branding, "branding");
  assertOptionalObject(config.branding?.theme, "branding.theme");
  assertOptionalComponent(config.adminLayout, "adminLayout");
  assertOptionalObject(config.messages, "messages");
  assertOptionalObject(config.redirect, "redirect");
  assertOptionalLocale(config.defaultLocale);
}
