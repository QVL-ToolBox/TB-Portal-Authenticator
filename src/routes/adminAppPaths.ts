import { ADMIN_PORTAL_PATHS } from "./adminPortalPaths";

export const ADMIN_APP_PATHS = {
  root: "/",
  dashboard: "/dashboard",
  forbidden: "/forbidden",
  ...ADMIN_PORTAL_PATHS,
} as const;

export type AdminAppPath = (typeof ADMIN_APP_PATHS)[keyof typeof ADMIN_APP_PATHS];
