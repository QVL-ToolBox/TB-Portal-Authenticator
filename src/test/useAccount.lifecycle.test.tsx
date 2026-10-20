import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthPortal } from "../index";
import {
  captureDocumentNavigation,
  findHeading,
  jsonResponse,
  TEST_CONFIG,
  TEST_ME,
} from "./authPortalTestKit";

interface PendingMe {
  signals: Array<AbortSignal | null | undefined>;
  replyAll: (response: () => Response) => void;
}

function stubPendingMe(): PendingMe {
  const waiters: Array<(response: Response) => void> = [];
  const signals: Array<AbortSignal | null | undefined> = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith("/me")) {
        signals.push(init?.signal);
        return new Promise<Response>((resolve) => waiters.push(resolve));
      }
      return Promise.resolve(jsonResponse(200, { enabled: true }));
    }),
  );
  return {
    signals,
    replyAll: (response) => waiters.splice(0).forEach((resolve) => resolve(response())),
  };
}

async function drainPendingTasks(rounds = 5) {
  for (let round = 0; round < rounds; round += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function loginNavigations(spies: Array<{ mock: { calls: unknown[][] } }>): number {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .filter((call) => String(call[2] ?? "").startsWith("/login")).length;
}

function openAccount(strict = false) {
  window.history.replaceState({}, "", "/account");
  const portal = <AuthPortal config={TEST_CONFIG} />;
  return render(strict ? <StrictMode>{portal}</StrictMode> : portal);
}

describe("useAccount - cycle de vie de la requete GET /me", () => {
  it("transmet un AbortSignal a getMe", async () => {
    const me = stubPendingMe();
    openAccount();
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    expect(me.signals[0]).toBeInstanceOf(AbortSignal);
    expect(me.signals[0]?.aborted).toBe(false);
  });

  it("annule la requete au demontage", async () => {
    const me = stubPendingMe();
    const view = openAccount();
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    view.unmount();
    expect(me.signals.every((signal) => signal?.aborted)).toBe(true);
  });

  it("un 401 tardif apres demontage ne navigue pas", async () => {
    const me = stubPendingMe();
    const navigations = captureDocumentNavigation();
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    const consoleError = vi.spyOn(console, "error");
    const view = openAccount();
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    view.unmount();
    me.replyAll(() => jsonResponse(401, { error: "unauthorized" }));
    await drainPendingTasks();
    expect(window.location.pathname).toBe("/account");
    expect(loginNavigations([pushState, replaceState])).toBe(0);
    expect(navigations).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("une reponse tardive 200 apres demontage ne leve pas d'erreur", async () => {
    const me = stubPendingMe();
    const consoleError = vi.spyOn(console, "error");
    const view = openAccount();
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    view.unmount();
    me.replyAll(() => jsonResponse(200, TEST_ME));
    await drainPendingTasks();
    expect(window.location.pathname).toBe("/account");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("un 401 recu pendant le montage navigue une fois vers la connexion", async () => {
    const me = stubPendingMe();
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    openAccount();
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    me.replyAll(() => jsonResponse(401, { error: "unauthorized" }));
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(loginNavigations([pushState, replaceState])).toBe(1);
  });

  it("en StrictMode, un 401 provoque au plus une navigation vers la connexion", async () => {
    const me = stubPendingMe();
    const pushState = vi.spyOn(window.history, "pushState");
    const replaceState = vi.spyOn(window.history, "replaceState");
    openAccount(true);
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    me.replyAll(() => jsonResponse(401, { error: "unauthorized" }));
    expect(await findHeading("Connexion")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    expect(new URLSearchParams(window.location.search).get("redirect")).toBe("/account");
    expect(loginNavigations([pushState, replaceState])).toBeLessThanOrEqual(1);
  });

  it("en StrictMode, le premier montage annule sa requete et le profil s'affiche", async () => {
    const me = stubPendingMe();
    openAccount(true);
    await waitFor(() => expect(me.signals.length).toBeGreaterThan(0));
    me.replyAll(() => jsonResponse(200, TEST_ME));
    expect(await screen.findByText(TEST_ME.email)).toBeInTheDocument();
    expect(me.signals.filter((signal) => !signal?.aborted).length).toBeLessThanOrEqual(1);
  });
});
