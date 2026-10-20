const INTERNAL_SERVER_ERROR = 500;
const MIN_ERROR_STATUS = 400;
const MAX_ERROR_STATUS = 599;

function declaredStatusOf(error: unknown): unknown {
  if (typeof error !== "object" || error === null) return undefined;
  if ("status" in error) return error.status;
  if ("statusCode" in error) return error.statusCode;
  return undefined;
}

export function httpErrorStatus(error: unknown): number {
  const status = declaredStatusOf(error);
  const isErrorStatus =
    typeof status === "number" && status >= MIN_ERROR_STATUS && status <= MAX_ERROR_STATUS;
  return isErrorStatus ? status : INTERNAL_SERVER_ERROR;
}
