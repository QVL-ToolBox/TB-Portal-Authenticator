import { safeDecode } from "./safeDecode";
import { isTrustedUrl } from "./trustedOrigins";

export interface RedirectPolicy {
  trustedOrigins: readonly string[];
  fallbackRedirect: string;
}

const FIRST_PRINTABLE_CODE = 0x20;
const DELETE_CODE = 0x7f;
const MAX_DECODE_PASSES = 5;
const RELATIVE_PATH_PROBE_BASE = "https://relative-path.invalid";

function isUnsafeCharacter(char: string): boolean {
  const code = char.charCodeAt(0);
  return char === "\\" || code < FIRST_PRINTABLE_CODE || code === DELETE_CODE;
}

export function isCleanRelativePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//") && ![...value].some(isUnsafeCharacter);
}

function stayOnCurrentOrigin(path: string): boolean {
  return new URL(path, RELATIVE_PATH_PROBE_BASE).origin === RELATIVE_PATH_PROBE_BASE;
}

function decodingPasses(raw: string): readonly string[] | null {
  const passes = [raw];
  for (let pass = 0; pass < MAX_DECODE_PASSES; pass += 1) {
    const current = passes[passes.length - 1];
    const decoded = safeDecode(current);
    if (decoded === null) return null;
    if (decoded === current) return passes;
    passes.push(decoded);
  }
  return null;
}

function isSafeRelativePath(raw: string): boolean {
  const passes = decodingPasses(raw);
  return passes !== null && passes.every(isCleanRelativePath) && stayOnCurrentOrigin(raw);
}

function trustedAbsoluteUrl(raw: string, trustedOrigins: readonly string[]): string | null {
  if (!URL.canParse(raw)) return null;
  const url = new URL(raw);
  return isTrustedUrl(url, trustedOrigins) ? url.href : null;
}

export function validateRedirectTarget(
  raw: string | null | undefined,
  trustedOrigins: readonly string[],
): string | null {
  if (typeof raw !== "string" || raw === "") return null;
  if (raw.startsWith("/")) {
    return isSafeRelativePath(raw) ? raw : null;
  }
  return trustedAbsoluteUrl(raw, trustedOrigins);
}

export function safeRedirect(raw: string | null | undefined, policy: RedirectPolicy): string {
  return validateRedirectTarget(raw, policy.trustedOrigins) ?? policy.fallbackRedirect;
}
