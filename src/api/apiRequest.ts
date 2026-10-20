import type { CanopApiClient } from "@canop/ui";

export type ApiRequest = CanopApiClient["request"];

export function refreshPathOf(authBasePath: string): string {
  return `${authBasePath.replace(/\/+$/, "")}/refresh`;
}

export function withBasePath(request: ApiRequest, basePath: string): ApiRequest {
  return function requestUnderBasePath<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(`${basePath}${path}`, init);
  };
}

export function withErrorHook(request: ApiRequest, onError: (error: unknown) => void): ApiRequest {
  return async function requestWithErrorHook<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      return await request<T>(path, init);
    } catch (error) {
      onError(error);
      throw error;
    }
  };
}
