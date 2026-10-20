import { useOptionalAdminPortal } from "../config/AdminPortalContext";

export function useInlineAdminNav(): boolean {
  return useOptionalAdminPortal() === null;
}
