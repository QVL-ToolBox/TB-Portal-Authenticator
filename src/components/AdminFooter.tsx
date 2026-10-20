import { LegalLinks } from "@canop/ui";
import { useAdminPortal } from "../config/AdminPortalContext";

export function AdminFooter() {
  const { authPortalUrl } = useAdminPortal().config;
  return <LegalLinks authPortalUrl={authPortalUrl} />;
}
