import { Outlet } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminPortal } from "../config/AdminPortalContext";

export function AdminLayoutRoute() {
  const PortalLayout = useAdminPortal().config.adminLayout ?? AdminLayout;

  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
}
