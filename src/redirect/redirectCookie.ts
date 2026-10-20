import { safeDecode } from "./safeDecode";

const COOKIE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const COOKIE_DOMAIN_PATTERN = /^\.?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/;
const RESERVED_COOKIE_PREFIXES: readonly string[] = ["__host-", "__secure-"];

function hasReservedPrefix(name: string): boolean {
  const lowerName = name.toLowerCase();
  return RESERVED_COOKIE_PREFIXES.some((prefix) => lowerName.startsWith(prefix));
}

export function isValidCookieName(name: unknown): boolean {
  return typeof name === "string" && COOKIE_NAME_PATTERN.test(name) && !hasReservedPrefix(name);
}

export function isValidCookieDomain(domain: unknown): boolean {
  return typeof domain === "string" && COOKIE_DOMAIN_PATTERN.test(domain);
}

export function readRedirectCookie(cookieHeader: string, cookieName: string): string | null {
  const prefix = `${cookieName}=`;
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return entry === undefined ? null : safeDecode(entry.slice(prefix.length));
}

export function expiredRedirectCookie(cookieName: string, cookieDomain?: string): string {
  const domainAttribute = cookieDomain ? `; domain=${cookieDomain}` : "";
  return `${cookieName}=; path=/; max-age=0; SameSite=Lax${domainAttribute}`;
}

export function consumeRedirectCookie(cookieName: string, cookieDomain?: string): string | null {
  const target = readRedirectCookie(document.cookie, cookieName);
  if (target !== null) {
    document.cookie = expiredRedirectCookie(cookieName, cookieDomain);
  }
  return target;
}
