import type { IncomingMessage, OutgoingHttpHeaders } from "node:http";
import { TLSSocket } from "node:tls";
import { withoutHopByHopHeaders } from "./hopByHopHeaders.js";

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value.join(", ") : value;
}

function forwardedFor(request: IncomingMessage): string {
  const clientAddress = request.socket.remoteAddress ?? "";
  const previous = singleHeader(request.headers["x-forwarded-for"]);
  return previous ? `${previous}, ${clientAddress}` : clientAddress;
}

function forwardedProto(request: IncomingMessage): string {
  const socketProtocol = request.socket instanceof TLSSocket ? "https" : "http";
  return singleHeader(request.headers["x-forwarded-proto"]) ?? socketProtocol;
}

function forwardedHost(request: IncomingMessage): OutgoingHttpHeaders {
  const host = singleHeader(request.headers["x-forwarded-host"]) ?? request.headers.host;
  return host ? { "x-forwarded-host": host } : {};
}

export function gatewayRequestHeaders(
  request: IncomingMessage,
  gatewayHost: string,
): OutgoingHttpHeaders {
  return {
    ...withoutHopByHopHeaders(request.headers),
    host: gatewayHost,
    "x-forwarded-for": forwardedFor(request),
    "x-forwarded-proto": forwardedProto(request),
    ...forwardedHost(request),
  };
}
