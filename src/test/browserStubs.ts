import { vi } from "vitest";

export function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

const restorers: Array<() => void> = [];

export function restoreBrowserCaptures(): void {
  while (restorers.length > 0) restorers.pop()?.();
}

export function captureDocumentNavigation(): string[] {
  const real = window.location;
  const original = Object.getOwnPropertyDescriptor(window, "location");
  const targets: string[] = [];
  const record = (url: string | URL) => {
    targets.push(String(url));
  };
  const readable = ["hash", "host", "hostname", "origin", "pathname", "port", "protocol", "search"];
  const fake: Record<string, unknown> = {
    assign: record,
    replace: record,
    reload: () => undefined,
    toString: () => real.href,
    ancestorOrigins: real.ancestorOrigins,
  };
  for (const key of readable) {
    Object.defineProperty(fake, key, { get: () => real[key as keyof Location] });
  }
  Object.defineProperty(fake, "href", { get: () => real.href, set: record });
  Object.defineProperty(window, "location", { configurable: true, value: fake });
  restorers.push(() => {
    if (original) Object.defineProperty(window, "location", original);
  });
  return targets;
}

export function captureCookieWrites(): string[] {
  const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  const writes: string[] = [];
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => descriptor?.get?.call(document),
    set: (value: string) => {
      writes.push(value);
      descriptor?.set?.call(document, value);
    },
  });
  restorers.push(() => {
    delete (document as unknown as Record<string, unknown>).cookie;
  });
  return writes;
}

export function clearAllCookies(): void {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}
