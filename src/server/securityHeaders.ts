import { validateHeaderName, validateHeaderValue, type ServerResponse } from "node:http";

export type SecurityHeaderOverrides = Readonly<Record<string, string | false>>;

export type SecurityHeadersOption = boolean | SecurityHeaderOverrides;

export type SecurityHeaders = ReadonlyArray<readonly [name: string, value: string]>;

export const DEFAULT_SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
};

function lowerCaseKeys<T>(headers: Readonly<Record<string, T>>): Map<string, T> {
  return new Map(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));
}

function assertValidHeader(name: string, value: string): void {
  validateHeaderName(name);
  validateHeaderValue(name, value);
}

function mergeOverrides(overrides: SecurityHeaderOverrides): SecurityHeaders {
  const merged = lowerCaseKeys<string | false>({ ...DEFAULT_SECURITY_HEADERS });
  lowerCaseKeys(overrides).forEach((value, name) => merged.set(name, value));
  return [...merged].filter((entry): entry is [string, string] => entry[1] !== false);
}

function assertOverrides(option: unknown): asserts option is SecurityHeaderOverrides {
  if (typeof option !== "object" || option === null || Array.isArray(option)) {
    throw new TypeError("securityHeaders doit etre un booleen ou un objet nom -> valeur");
  }
  Object.entries(option).forEach(([name, value]) => {
    if (value !== false && typeof value !== "string") {
      throw new TypeError(`securityHeaders["${name}"] doit etre une chaine ou false`);
    }
  });
}

export function resolveSecurityHeaders(option: SecurityHeadersOption = false): SecurityHeaders {
  if (option === false) return [];
  if (option === true) return mergeOverrides({});
  assertOverrides(option);
  const headers = mergeOverrides(option);
  headers.forEach(([name, value]) => assertValidHeader(name, value));
  return headers;
}

export function applySecurityHeaders(response: ServerResponse, headers: SecurityHeaders): void {
  headers.forEach(([name, value]) => response.setHeader(name, value));
}
