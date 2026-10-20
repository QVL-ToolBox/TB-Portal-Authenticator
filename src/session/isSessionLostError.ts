import { CanopApiError } from "@canop/ui";

const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const ACCOUNT_LOCKOUT_CODES: ReadonlySet<string> = new Set(["account_disabled", "account_pending"]);

function isAccountLockout(error: CanopApiError): boolean {
  return (
    error.status === FORBIDDEN && error.code !== undefined && ACCOUNT_LOCKOUT_CODES.has(error.code)
  );
}

export function isSessionLostError(error: unknown): error is CanopApiError {
  return (
    error instanceof CanopApiError && (error.status === UNAUTHORIZED || isAccountLockout(error))
  );
}
