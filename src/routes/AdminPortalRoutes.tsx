import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "../components/RequireAdmin";
import { useAdminDocumentTitle } from "../hooks/useAdminDocumentTitle";
import { DashboardPage } from "../pages/DashboardPage";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import { PortalsPage } from "../pages/PortalsPage";
import { RolesPage } from "../pages/RolesPage";
import { UsersPage } from "../pages/UsersPage";
import { AdminLayoutRoute } from "./AdminLayoutRoute";
import { ADMIN_APP_PATHS } from "./adminAppPaths";

const REDIRECT_TO_DASHBOARD = <Navigate to={ADMIN_APP_PATHS.dashboard} replace />;

export function AdminPortalRoutes() {
  useAdminDocumentTitle();

  return (
    <Routes>
      <Route path={ADMIN_APP_PATHS.forbidden} element={<ForbiddenPage />} />
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayoutRoute />}>
          <Route path={ADMIN_APP_PATHS.root} element={REDIRECT_TO_DASHBOARD} />
          <Route path={ADMIN_APP_PATHS.dashboard} element={<DashboardPage />} />
          <Route path={ADMIN_APP_PATHS.users} element={<UsersPage />} />
          <Route path={ADMIN_APP_PATHS.roles} element={<RolesPage />} />
          <Route path={ADMIN_APP_PATHS.portals} element={<PortalsPage />} />
          <Route path="*" element={REDIRECT_TO_DASHBOARD} />
        </Route>
      </Route>
    </Routes>
  );
}
