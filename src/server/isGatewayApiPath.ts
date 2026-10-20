export const GATEWAY_API_PREFIX = "/api";

export function isGatewayApiPath(pathname: string): boolean {
  return pathname === GATEWAY_API_PREFIX || pathname.startsWith(`${GATEWAY_API_PREFIX}/`);
}
