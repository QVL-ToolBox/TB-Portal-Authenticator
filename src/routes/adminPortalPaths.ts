export const ADMIN_PORTAL_PATHS = {
  users: "/users",
  roles: "/roles",
  portals: "/portals",
} as const;

export type AdminPortalPath = (typeof ADMIN_PORTAL_PATHS)[keyof typeof ADMIN_PORTAL_PATHS];
