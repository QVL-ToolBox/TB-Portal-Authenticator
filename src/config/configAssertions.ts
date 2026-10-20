import type { CanopLocale } from "@canop/ui";
import { authPortalMessages } from "../i18n/authPortalMessages";
import { isCleanRelativePath } from "../redirect/safeRedirect";
import { invalidAuthPortalConfig } from "./AuthPortalConfigError";
import { isRecord } from "./configGuards";

const UNDISPLAYABLE_VALUE = "[valeur non affichable]";

function describeValueType(value: unknown): string {
  try {
    return Object.prototype.toString.call(value);
  } catch {
    return UNDISPLAYABLE_VALUE;
  }
}

export function displayValue(value: unknown): string {
  try {
    return String(value);
  } catch {
    return describeValueType(value);
  }
}

export function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isApiBasePath(value: unknown): boolean {
  return typeof value === "string" && isCleanRelativePath(value);
}

function isSupportedLocale(value: unknown): value is CanopLocale {
  return typeof value === "string" && Object.hasOwn(authPortalMessages, value);
}

function supportedLocales(): string {
  return Object.keys(authPortalMessages).join(", ");
}

const WRAPPED_COMPONENT_TYPES = new Set<unknown>([
  Symbol.for("react.memo"),
  Symbol.for("react.forward_ref"),
  Symbol.for("react.lazy"),
]);

function isComponent(value: unknown): boolean {
  if (typeof value === "function") return true;
  return isRecord(value) && WRAPPED_COMPONENT_TYPES.has(value.$$typeof);
}

export function assertOptionalObject(value: unknown, key: string): void {
  if (value !== undefined && !isRecord(value)) {
    invalidAuthPortalConfig(`${key} doit etre un objet s'il est fourni`);
  }
}

export function assertOptionalBoolean(value: unknown, key: string): void {
  if (value !== undefined && typeof value !== "boolean") {
    invalidAuthPortalConfig(
      `${key} doit etre un booleen s'il est fourni : "${displayValue(value)}"`,
    );
  }
}

export function assertOptionalComponent(value: unknown, key: string): void {
  if (value !== undefined && !isComponent(value)) {
    invalidAuthPortalConfig(
      `${key} doit etre un composant React s'il est fourni : "${displayValue(value)}"`,
    );
  }
}

export function assertOptionalApiBasePath(value: unknown, key: string): void {
  if (value !== undefined && !isApiBasePath(value)) {
    invalidAuthPortalConfig(
      `${key} doit etre un chemin relatif commencant par un seul "/" : "${displayValue(value)}"`,
    );
  }
}

export function assertOptionalLocale(value: unknown): void {
  if (value !== undefined && !isSupportedLocale(value)) {
    invalidAuthPortalConfig(
      `defaultLocale doit valoir ${supportedLocales()} : "${displayValue(value)}"`,
    );
  }
}

export function assertRequiredName(value: unknown, key: string): void {
  if (!isNonBlankString(value)) {
    invalidAuthPortalConfig(`${key} est requis`);
  }
}
