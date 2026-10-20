import { createServer, type Server } from "node:http";
import { createPortalServer } from "./createPortalServer.js";
import type { StartPortalServerOptions } from "./portalServerOptions.js";

export const LOOPBACK_HOST = "127.0.0.1";

export function startPortalServer({
  port,
  host = LOOPBACK_HOST,
  securityHeaders = true,
  ...options
}: StartPortalServerOptions): Server {
  const server = createServer(createPortalServer({ ...options, securityHeaders }));

  return server.listen(port, host, () => {
    console.log(
      JSON.stringify({
        level: "INFO",
        msg: "portail demarre",
        service: options.service,
        host,
        port,
        gateway_url: options.gatewayUrl,
        security_headers: securityHeaders !== false,
      }),
    );
  });
}
