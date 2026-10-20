import {
  request as httpRequest,
  STATUS_CODES,
  type ClientRequest,
  type IncomingMessage,
  type RequestOptions,
  type ServerResponse,
} from "node:http";
import { request as httpsRequest } from "node:https";
import { gatewayRequestHeaders } from "./gatewayRequestHeaders.js";
import { withoutHopByHopHeaders } from "./hopByHopHeaders.js";

const BAD_GATEWAY = 502;
const GATEWAY_TIMEOUT = 504;
export const GATEWAY_TIMEOUT_MS = 30_000;
const REQUEST_URL_BASE = "http://portal.invalid";
const PLAIN_TEXT_HEADERS = { "content-type": "text/plain; charset=utf-8" };

export type GatewayForwarder = (request: IncomingMessage, response: ServerResponse) => void;

type SendRequest = (
  options: RequestOptions,
  onResponse: (response: IncomingMessage) => void,
) => ClientRequest;

function sendRequestFor(protocol: string): SendRequest {
  return protocol === "https:"
    ? (options, onResponse) => httpsRequest(options, onResponse)
    : (options, onResponse) => httpRequest(options, onResponse);
}

function hostnameOf(url: URL): string {
  return url.hostname.replace(/^\[(.*)\]$/, "$1");
}

function respondGatewayFailure(response: ServerResponse, status: number): void {
  if (response.writableEnded) return;
  if (response.headersSent) {
    response.destroy();
    return;
  }
  response.writeHead(status, PLAIN_TEXT_HEADERS);
  response.end(STATUS_CODES[status]);
}

function gatewayPath(basePath: string, requestUrl: string | undefined): string {
  const { pathname, search } = new URL(requestUrl ?? "/", REQUEST_URL_BASE);
  return `${basePath}${pathname}${search}`;
}

function relayGatewayResponse(gatewayResponse: IncomingMessage, response: ServerResponse): void {
  response.writeHead(
    gatewayResponse.statusCode ?? BAD_GATEWAY,
    withoutHopByHopHeaders(gatewayResponse.headers),
  );
  gatewayResponse.on("error", () => response.destroy());
  gatewayResponse.pipe(response);
}

function assertGatewayTimeout(gatewayTimeoutMs: number): void {
  if (!Number.isInteger(gatewayTimeoutMs) || gatewayTimeoutMs <= 0) {
    throw new RangeError(
      `gatewayTimeoutMs doit etre un entier strictement positif (recu : ${gatewayTimeoutMs})`,
    );
  }
}

export function createGatewayForwarder(
  gatewayUrl: string,
  gatewayTimeoutMs = GATEWAY_TIMEOUT_MS,
): GatewayForwarder {
  assertGatewayTimeout(gatewayTimeoutMs);
  const gateway = new URL(gatewayUrl);
  const sendRequest = sendRequestFor(gateway.protocol);
  const basePath = gateway.pathname.replace(/\/$/, "");

  return (request, response) => {
    const gatewayRequest = sendRequest(
      {
        protocol: gateway.protocol,
        hostname: hostnameOf(gateway),
        port: gateway.port,
        method: request.method,
        path: gatewayPath(basePath, request.url),
        headers: gatewayRequestHeaders(request, gateway.host),
      },
      (gatewayResponse) => relayGatewayResponse(gatewayResponse, response),
    );

    gatewayRequest.setTimeout(gatewayTimeoutMs, () => {
      respondGatewayFailure(response, GATEWAY_TIMEOUT);
      gatewayRequest.destroy();
    });
    gatewayRequest.on("error", () => {
      request.unpipe(gatewayRequest);
      respondGatewayFailure(response, BAD_GATEWAY);
    });
    response.on("close", () => {
      if (!response.writableFinished) gatewayRequest.destroy();
    });
    request.pipe(gatewayRequest);
  };
}
