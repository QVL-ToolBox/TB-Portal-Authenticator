import type { SecurityHeadersOption } from "./securityHeaders.js";

export type PortalServerOptions = {
  service: string;
  gatewayUrl: string;
  distDir: string;
  gatewayTimeoutMs?: number;
  securityHeaders?: SecurityHeadersOption;
};

export type StartPortalServerOptions = PortalServerOptions & {
  port: number;
  host?: string;
};
