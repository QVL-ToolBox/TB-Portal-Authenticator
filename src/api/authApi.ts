import { createApiClient } from "@canop/ui";
import type { ApiRequest } from "./apiRequest";

export interface Me {
  user_id: string;
  name: string;
  email: string;
  roles: string[];
  whitelist_only: boolean;
  created_at: string;
}

export interface RegistrationSetting {
  enabled: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  acceptedTermsVersion: string;
}

export interface AuthApi {
  login: (email: string, password: string) => Promise<unknown>;
  register: (payload: RegisterPayload) => Promise<unknown>;
  forgotPassword: (email: string) => Promise<unknown>;
  resetPassword: (token: string, newPassword: string) => Promise<unknown>;
  getRegistrationEnabled: () => Promise<RegistrationSetting>;
  getMe: (signal?: AbortSignal) => Promise<Me>;
  logout: () => Promise<unknown>;
}

function postJson(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

export function createAuthApi(basePath: string): AuthApi {
  return authApiFrom(createApiClient({ basePath }).request);
}

export function authApiFrom(request: ApiRequest): AuthApi {
  return {
    login: (email, password) => request<unknown>("/login", postJson({ email, password })),
    register: ({ name, email, password, acceptedTermsVersion }) =>
      request<unknown>(
        "/register",
        postJson({ name, email, password, accepted_terms_version: acceptedTermsVersion }),
      ),
    forgotPassword: (email) => request<unknown>("/password/forgot", postJson({ email })),
    resetPassword: (token, newPassword) =>
      request<unknown>("/password/reset", postJson({ token, new_password: newPassword })),
    getRegistrationEnabled: () => request<RegistrationSetting>("/settings/registration"),
    getMe: (signal) => request<Me>("/me", { signal }),
    logout: () => request<unknown>("/logout", { method: "POST" }),
  };
}
