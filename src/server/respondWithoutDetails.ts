import type { ErrorRequestHandler, Response } from "express";
import { httpErrorStatus } from "./httpErrorStatus.js";
import { applySecurityHeaders, type SecurityHeaders } from "./securityHeaders.js";

function clearHeaders(response: Response): void {
  response.getHeaderNames().forEach((name) => response.removeHeader(name));
}

export function respondWithoutDetails(securityHeaders: SecurityHeaders): ErrorRequestHandler {
  return (error, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    clearHeaders(response);
    applySecurityHeaders(response, securityHeaders);
    response.sendStatus(httpErrorStatus(error));
  };
}
