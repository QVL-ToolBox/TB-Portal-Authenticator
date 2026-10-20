import { useMemo } from "react";
import { createAdminApi } from "../api/adminApi";
import { createAuthApi } from "../api/authApi";
import type { AuthPortalContextValue } from "./AuthPortalContext";
import type { ResolvedAuthPortalConfig } from "./authPortalConfig";

export function useAuthPortalValue(config: ResolvedAuthPortalConfig): AuthPortalContextValue {
  const { apiBasePath, adminApiBasePath } = config;
  const api = useMemo(() => createAuthApi(apiBasePath), [apiBasePath]);
  const adminApi = useMemo(
    () => createAdminApi(adminApiBasePath, apiBasePath),
    [adminApiBasePath, apiBasePath],
  );
  return useMemo(() => ({ config, api, adminApi }), [config, api, adminApi]);
}
