import type { ComponentType } from "react";
import { AuthPortalShell } from "./AuthPortalShell";
import { resolveAuthPortalConfig, type AuthPortalConfig } from "./config/authPortalConfig";

export function createAuthApp(config: AuthPortalConfig): ComponentType {
  const resolved = resolveAuthPortalConfig(config);

  function AuthApp() {
    return <AuthPortalShell resolved={resolved} />;
  }

  return AuthApp;
}
