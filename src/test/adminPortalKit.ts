import { render } from "@testing-library/react";
import { createElement, StrictMode } from "react";
import { vi } from "vitest";
import { createAdminApp, type AdminPortalConfig, type AdminUser, type Me } from "../index";
import { captureDocumentNavigation, jsonResponse } from "./authPortalTestKit";

export const AUTH_PORTAL_URL = "https://auth.example.test";
export const LOGIN_TARGET = `${AUTH_PORTAL_URL}/login?redirect=1`;
export const CGU_URL = `${AUTH_PORTAL_URL}/cgu`;

export const ADMIN_CONFIG: AdminPortalConfig = {
  appName: "Acme Admin",
  authPortalUrl: AUTH_PORTAL_URL,
};

export type Reply = { status: number; body?: unknown };
export type AdminRoutes = Record<string, Reply>;

export const meWithRoles = (roles: string[]): Reply => ({
  status: 200,
  body: {
    user_id: "u-admin",
    name: "Ada Admin",
    email: "ada@example.test",
    roles,
    whitelist_only: false,
    created_at: "2026-01-01T00:00:00Z",
  } satisfies Me,
});

export const apiError = (status: number, error: string): Reply => ({
  status,
  body: { error, message: `${error} message` },
});

export const PENDING_USER: AdminUser = {
  user_id: "u-pending",
  name: "Pierre Pending",
  email: "pierre@example.test",
  roles: [],
  status: "pending_validation",
  whitelist_only: false,
  devices: [],
  created_at: "2026-01-02T00:00:00Z",
};

export const HEALTHY_ADMIN_API: AdminRoutes = {
  "GET /api/admin/users": {
    status: 200,
    body: { users: [PENDING_USER], page: 1, limit: 100, total: 1 },
  },
  "GET /api/admin/settings/registration": { status: 200, body: { enabled: true } },
  "GET /api/admin/analytics/traffic": {
    status: 200,
    body: { period: "week", registrations: 0, portals: [] },
  },
  "GET /api/admin/portals": { status: 200, body: [] },
  "GET /api/admin/roles": { status: 200, body: [] },
  "POST /api/auth/refresh": apiError(401, "unauthorized"),
};

export interface AdminBackend {
  requests: string[];
  failedAdminCalls: () => number;
}

export function stubAdminBackend(routes: AdminRoutes): AdminBackend {
  const all = { ...HEALTHY_ADMIN_API, ...routes };
  const requests: string[] = [];
  const statuses: { key: string; status: number }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const pathname = new URL(String(input), window.location.origin).pathname;
      const key = `${method} ${pathname}`;
      requests.push(key);
      const reply = all[key] ?? apiError(404, "not_found");
      statuses.push({ key, status: reply.status });
      return jsonResponse(reply.status, reply.body);
    }),
  );
  return {
    requests,
    failedAdminCalls: () =>
      statuses.filter(({ key, status }) => key.includes("/api/admin/") && status >= 400).length,
  };
}

export interface AdminRenderOptions {
  url?: string;
  strict?: boolean;
}

export function renderAdminApp(
  config: AdminPortalConfig,
  routes: AdminRoutes,
  { url = "/", strict = false }: AdminRenderOptions = {},
) {
  const backend = stubAdminBackend(routes);
  window.history.replaceState({}, "", url);
  const App = createAdminApp(config);
  const navigations = captureDocumentNavigation();
  const app = createElement(App);
  render(strict ? createElement(StrictMode, null, app) : app);
  return { backend, navigations };
}

export function settle(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function currentPath(): string {
  return window.location.pathname;
}

export function linksTo(href: string): HTMLAnchorElement[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>("a")).filter(
    (anchor) => anchor.getAttribute("href") === href,
  );
}
