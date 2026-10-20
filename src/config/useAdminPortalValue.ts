import { createApiClient } from "@canop/ui";
import { useMemo } from "react";
import { adminApiFrom } from "../api/adminApi";
import { refreshPathOf, withBasePath, withErrorHook, type ApiRequest } from "../api/apiRequest";
import { authApiFrom } from "../api/authApi";
import { isSessionLostError } from "../session/isSessionLostError";
import type { AdminPortalContextValue } from "./AdminPortalContext";
import type { ResolvedAdminPortalConfig } from "./adminPortalConfig";
import { useAdminSession } from "./useAdminSession";

const GATEWAY_ROOT = "";

function sessionAwareRequest(apiBasePath: string, onSessionLost: () => void): ApiRequest {
  const { request } = createApiClient({
    basePath: GATEWAY_ROOT,
    withRefresh: true,
    refreshPath: refreshPathOf(apiBasePath),
  });
  return withErrorHook(request, (error) => {
    if (isSessionLostError(error)) onSessionLost();
  });
}

export function useAdminPortalValue(config: ResolvedAdminPortalConfig): AdminPortalContextValue {
  const session = useAdminSession(config);
  const { redirectToLogin } = session;
  const { apiBasePath, adminApiBasePath } = config;

  const request = useMemo(
    () => sessionAwareRequest(apiBasePath, redirectToLogin),
    [apiBasePath, redirectToLogin],
  );
  const api = useMemo(
    () => authApiFrom(withBasePath(request, apiBasePath)),
    [request, apiBasePath],
  );
  const adminApi = useMemo(
    () => adminApiFrom(withBasePath(request, adminApiBasePath)),
    [request, adminApiBasePath],
  );

  return useMemo(() => ({ config, api, adminApi, session }), [config, api, adminApi, session]);
}
