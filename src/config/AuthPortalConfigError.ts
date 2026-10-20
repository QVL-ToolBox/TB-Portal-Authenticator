export class AuthPortalConfigError extends Error {
  override name = "AuthPortalConfigError";

  constructor(reason: string) {
    super(`Config du portail d'authentification invalide : ${reason}`);
  }
}

export function invalidAuthPortalConfig(reason: string): never {
  throw new AuthPortalConfigError(reason);
}
