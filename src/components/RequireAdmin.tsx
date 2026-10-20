import { RouteGuard } from "@canop/ui";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { Me } from "../api/authApi";
import { useRequireAdmin } from "../hooks/useRequireAdmin";
import { ADMIN_APP_PATHS } from "../routes/adminAppPaths";

export interface RequireAdminProps {
  children?: ReactNode;
}

function renderForbidden() {
  return <Navigate to={ADMIN_APP_PATHS.forbidden} replace />;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const guard = useRequireAdmin();

  return (
    <RouteGuard<Me>
      {...guard}
      renderForbidden={renderForbidden}
      renderAuthorized={() => children ?? <Outlet />}
    />
  );
}
