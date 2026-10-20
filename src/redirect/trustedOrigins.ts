const HTTP_PROTOCOLS: readonly string[] = ["http:", "https:"];

export function hasCredentials(url: URL): boolean {
  return url.username !== "" || url.password !== "";
}

export function isHttpUrl(url: URL): boolean {
  return HTTP_PROTOCOLS.includes(url.protocol);
}

function isBareOrigin(url: URL): boolean {
  return url.pathname === "/" && url.search === "" && url.hash === "";
}

export function parseTrustedOrigin(origin: string): string | null {
  if (!URL.canParse(origin)) return null;
  const url = new URL(origin);
  return isHttpUrl(url) && !hasCredentials(url) && isBareOrigin(url) ? url.origin : null;
}

export function isTrustedUrl(url: URL, trustedOrigins: readonly string[]): boolean {
  return isHttpUrl(url) && !hasCredentials(url) && trustedOrigins.includes(url.origin);
}
