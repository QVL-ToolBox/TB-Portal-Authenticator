export function distinctErrors(errors: readonly (string | null)[]): string[] {
  return [...new Set(errors.filter((error): error is string => error !== null))];
}
