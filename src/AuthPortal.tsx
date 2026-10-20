import { AuthPortalShell } from "./AuthPortalShell";
import type { AuthPortalConfig } from "./config/authPortalConfig";
import { useResolvedAuthPortalConfig } from "./config/useResolvedAuthPortalConfig";

export interface AuthPortalProps {
  config: AuthPortalConfig;
}

export function AuthPortal({ config }: AuthPortalProps) {
  const resolved = useResolvedAuthPortalConfig(config);
  return <AuthPortalShell resolved={resolved} />;
}
