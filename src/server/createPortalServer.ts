import type { RequestListener } from "node:http";
import path from "node:path";
import express from "express";
import { createGatewayForwarder } from "./createGatewayForwarder.js";
import { isGatewayApiPath } from "./isGatewayApiPath.js";
import type { PortalServerOptions } from "./portalServerOptions.js";
import { respondWithoutDetails } from "./respondWithoutDetails.js";
import { applySecurityHeaders, resolveSecurityHeaders } from "./securityHeaders.js";

const SPA_ENTRY_FILE = "index.html";

export function createPortalServer({
  service,
  gatewayUrl,
  distDir,
  gatewayTimeoutMs,
  securityHeaders = false,
}: PortalServerOptions): RequestListener {
  const staticRoot = path.resolve(distDir);
  const forwardToGateway = createGatewayForwarder(gatewayUrl, gatewayTimeoutMs);
  const headers = resolveSecurityHeaders(securityHeaders);
  const app = express();
  app.disable("x-powered-by");

  app.use((_req, res, next) => {
    applySecurityHeaders(res, headers);
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service });
  });

  app.use((req, res, next) => {
    if (!isGatewayApiPath(req.path)) {
      next();
      return;
    }
    forwardToGateway(req, res);
  });

  app.use(express.static(staticRoot, { redirect: false }));
  app.use((_req, res, next) => {
    res.sendFile(path.join(staticRoot, SPA_ENTRY_FILE), (error) => {
      if (error) next(error);
    });
  });

  app.use(respondWithoutDetails(headers));

  return app;
}
