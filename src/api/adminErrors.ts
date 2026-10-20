import { CanopApiError, apiErrorMessage, type CanopTranslate } from "@canop/ui";

const ADMIN_REFUSAL_KEYS: ReadonlyMap<string, string> = new Map([
  ["last_admin", "auth.admin.error.lastAdmin"],
  ["self_modification", "auth.admin.error.selfModification"],
]);

const ERROR_CODE_PATTERN = /^[a-z0-9]+(?:[_.:-][a-z0-9]+)*$/;

function readableServerMessage({ message, code, status }: CanopApiError): string | null {
  const text = message.trim();
  const isMachineText =
    text === "" || text === code || text === `Erreur ${status}` || ERROR_CODE_PATTERN.test(text);
  return isMachineText ? null : text;
}

export function adminErrorMessage(t: CanopTranslate, err: unknown, fallbackKey: string): string {
  if (!(err instanceof CanopApiError)) return t(fallbackKey);
  const refusalKey = err.code ? ADMIN_REFUSAL_KEYS.get(err.code) : undefined;
  if (refusalKey) return t(refusalKey);
  return apiErrorMessage(t, err.code, readableServerMessage(err) ?? t(fallbackKey));
}
