import { createApiClient } from "@canop/ui";
import { DEFAULT_API_BASE_PATH } from "../config/apiBasePathDefaults";
import { refreshPathOf, type ApiRequest } from "./apiRequest";
import type { RegistrationSetting } from "./authApi";

export type AccountStatus = "active" | "pending_validation" | "disabled";

export interface AdminUserDevice {
  id: string;
  label: string;
  first_seen: string;
  last_seen: string;
  last_ip: string | null;
}

export interface AdminUser {
  user_id: string;
  name: string;
  email: string;
  roles: string[];
  status: AccountStatus;
  whitelist_only: boolean;
  devices: AdminUserDevice[];
  created_at: string;
}

export interface AdminUserList {
  users: AdminUser[];
  page: number;
  limit: number;
  total: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  email?: string;
  status?: AccountStatus;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
}

export type AdminRoleKind = "portal" | "sub";

export interface AdminRole {
  id: string;
  name: string;
  portal: string;
  kind: AdminRoleKind;
  created_at: string;
}

export interface CreateRolePayload {
  name: string;
  portal: string;
}

export interface AdminPortal {
  name: string;
  audience: string;
  open: boolean;
}

export type TrafficPeriod = "day" | "week" | "month" | "year";

export interface PortalTraffic {
  portal: string;
  connected_users: number;
}

export interface AdminTraffic {
  period: string;
  registrations: number;
  portals: PortalTraffic[];
}

export interface AdminApi {
  listUsers: (params?: ListUsersParams, signal?: AbortSignal) => Promise<AdminUserList>;
  updateUser: (id: string, payload: UpdateUserPayload) => Promise<AdminUser>;
  updateUserStatus: (id: string, status: AccountStatus) => Promise<AdminUser>;
  updateUserRoles: (id: string, roles: string[]) => Promise<AdminUser>;
  updateUserPassword: (id: string, password: string) => Promise<unknown>;
  updateUserWhitelist: (id: string, whitelistOnly: boolean) => Promise<AdminUser>;
  revokeUserDevice: (id: string, deviceId: string) => Promise<AdminUser>;
  deleteUser: (id: string) => Promise<unknown>;
  listRoles: (signal?: AbortSignal) => Promise<AdminRole[]>;
  createRole: (payload: CreateRolePayload) => Promise<AdminRole>;
  deleteRole: (id: string) => Promise<unknown>;
  listPortals: (signal?: AbortSignal) => Promise<AdminPortal[]>;
  getRegistrationSetting: (signal?: AbortSignal) => Promise<RegistrationSetting>;
  setRegistrationSetting: (enabled: boolean) => Promise<RegistrationSetting>;
  getTraffic: (period: TrafficPeriod, signal?: AbortSignal) => Promise<AdminTraffic>;
}

function putJson(body: unknown): RequestInit {
  return { method: "PUT", body: JSON.stringify(body) };
}

function usersQuery({ page, limit, email, status }: ListUsersParams): string {
  const search = new URLSearchParams();
  if (page) search.set("page", String(page));
  if (limit) search.set("limit", String(limit));
  if (email) search.set("email", email);
  if (status) search.set("status", status);
  const query = search.toString();
  return query ? `?${query}` : "";
}

function userPath(id: string, suffix = ""): string {
  return `/users/${encodeURIComponent(id)}${suffix}`;
}

const REGISTRATION_SETTING_PATH = "/settings/registration";

export function createAdminApi(basePath: string, authBasePath = DEFAULT_API_BASE_PATH): AdminApi {
  const { request } = createApiClient({
    basePath,
    withRefresh: true,
    refreshPath: refreshPathOf(authBasePath),
  });
  return adminApiFrom(request);
}

export function adminApiFrom(request: ApiRequest): AdminApi {
  return {
    listUsers: (params = {}, signal) =>
      request<AdminUserList>(`/users${usersQuery(params)}`, { signal }),
    updateUser: (id, payload) => request<AdminUser>(userPath(id), putJson(payload)),
    updateUserStatus: (id, status) =>
      request<AdminUser>(userPath(id, "/status"), putJson({ status })),
    updateUserRoles: (id, roles) => request<AdminUser>(userPath(id, "/roles"), putJson({ roles })),
    updateUserPassword: (id, password) =>
      request<unknown>(userPath(id, "/password"), putJson({ password })),
    updateUserWhitelist: (id, whitelistOnly) =>
      request<AdminUser>(userPath(id, "/whitelist"), putJson({ whitelist_only: whitelistOnly })),
    revokeUserDevice: (id, deviceId) =>
      request<AdminUser>(userPath(id, `/devices/${encodeURIComponent(deviceId)}`), {
        method: "DELETE",
      }),
    deleteUser: (id) => request<unknown>(userPath(id), { method: "DELETE" }),
    listRoles: (signal) => request<AdminRole[]>("/roles", { signal }),
    createRole: (payload) =>
      request<AdminRole>("/roles", { method: "POST", body: JSON.stringify(payload) }),
    deleteRole: (id) => request<unknown>(`/roles/${encodeURIComponent(id)}`, { method: "DELETE" }),
    listPortals: (signal) => request<AdminPortal[]>("/portals", { signal }),
    getRegistrationSetting: (signal) =>
      request<RegistrationSetting>(REGISTRATION_SETTING_PATH, { signal }),
    setRegistrationSetting: (enabled) =>
      request<RegistrationSetting>(REGISTRATION_SETTING_PATH, putJson({ enabled })),
    getTraffic: (period, signal) =>
      request<AdminTraffic>(`/analytics/traffic?period=${encodeURIComponent(period)}`, { signal }),
  };
}
