import type { CanopLocaleMessages } from "@canop/ui";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { vi } from "vitest";
import { AuthPortal, type AuthPortalConfig, type Me } from "../index";
import { TEST_CONFIG } from "./testConfig";

export {
  captureCookieWrites,
  captureDocumentNavigation,
  clearAllCookies,
  stubMatchMedia,
} from "./browserStubs";
export { TestProviders } from "./TestProviders";
export {
  TEST_APP_NAME,
  TEST_CONFIG,
  TEST_TERMS_DATE,
  TEST_TERMS_DATE_FR,
  TEST_TERMS_VERSION,
} from "./testConfig";

export const TEST_ME: Me = {
  user_id: "u-1",
  name: "Camille Test",
  email: "camille@example.test",
  roles: ["lecteur"],
  whitelist_only: false,
  created_at: "2026-06-01T10:00:00Z",
};

export const STRONG_PASSWORD = "Secret123!";

type ApiReply = { status: number; body?: unknown } | Response;
type ApiHandler = (request: { body: unknown; init?: RequestInit }) => ApiReply;
export type ApiRoutes = Record<string, ApiReply | ApiHandler>;

export interface ApiCall {
  method: string;
  url: string;
  body: unknown;
}

export interface ApiStub {
  calls: ApiCall[];
  inits: RequestInit[];
  callsTo: (key: string) => ApiCall[];
}

export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseBody(init?: RequestInit): unknown {
  return typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
}

function toResponse(reply: ApiReply): Response {
  return reply instanceof Response ? reply : jsonResponse(reply.status, reply.body);
}

const DEFAULT_ROUTES: ApiRoutes = {
  "GET /api/auth/settings/registration": { status: 200, body: { enabled: true } },
  "GET /api/auth/me": { status: 401, body: { error: "unauthorized" } },
};

export function stubAuthApi(routes: ApiRoutes = {}): ApiStub {
  const allRoutes = { ...DEFAULT_ROUTES, ...routes };
  const calls: ApiCall[] = [];
  const inits: RequestInit[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method ?? "GET").toUpperCase();
    const url = String(input);
    const body = parseBody(init);
    calls.push({ method, url, body });
    inits.push(init ?? {});
    const route = allRoutes[`${method} ${url}`];
    if (!route) return jsonResponse(404, { error: "not_found" });
    return toResponse(typeof route === "function" ? route({ body, init }) : route);
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    calls,
    inits,
    callsTo: (key) => calls.filter((call) => `${call.method} ${call.url}` === key),
  };
}

export interface PortalRenderOptions {
  config?: AuthPortalConfig;
  messages?: CanopLocaleMessages;
}

export function renderPortalAt(url: string, options: PortalRenderOptions = {}) {
  window.history.replaceState({}, "", url);
  const config = options.config ?? TEST_CONFIG;
  const messages = options.messages ?? config.messages;
  return render(createElement(AuthPortal, { config: { ...config, messages } }));
}

export function currentLocation(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function setupUser() {
  return userEvent.setup({ delay: null });
}

export async function enterText(
  user: ReturnType<typeof setupUser>,
  field: HTMLElement,
  value: string,
) {
  await user.click(field);
  if (value) await user.paste(value);
}

export async function findHeading(name: string | RegExp) {
  return screen.findByRole("heading", { name });
}
