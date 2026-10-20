export const AUTH_PORTAL_PATHS = {
  root: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  pending: "/pending",
  cgu: "/cgu",
  account: "/account",
} as const;

export type AuthPortalPath = (typeof AUTH_PORTAL_PATHS)[keyof typeof AUTH_PORTAL_PATHS];
