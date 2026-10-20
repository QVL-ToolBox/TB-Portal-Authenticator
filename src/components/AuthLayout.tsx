import { Outlet } from "react-router-dom";
import { useAuthPortal } from "../config/AuthPortalContext";
import { useAuthPortalDocumentTitle } from "../hooks/useAuthPortalDocumentTitle";
import { AuthBrandLayout } from "./AuthBrandLayout";

export function AuthLayout() {
  const { layout: PortalLayout = AuthBrandLayout, footer } = useAuthPortal().config.branding;
  useAuthPortalDocumentTitle();

  return (
    <PortalLayout>
      <Outlet />
      {footer}
    </PortalLayout>
  );
}
