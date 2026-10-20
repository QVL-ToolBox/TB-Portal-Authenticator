import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "node:http";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "keep-alive",
  "proxy-connection",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function connectionListedHeaders(connection: string | undefined): string[] {
  return (connection ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name !== "");
}

export function withoutHopByHopHeaders(headers: IncomingHttpHeaders): OutgoingHttpHeaders {
  const removed = new Set([...HOP_BY_HOP_HEADERS, ...connectionListedHeaders(headers.connection)]);
  return Object.fromEntries(
    Object.entries(headers).filter(([name, value]) => value !== undefined && !removed.has(name)),
  );
}
