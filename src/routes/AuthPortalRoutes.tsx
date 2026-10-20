import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuthPortal } from "../config/AuthPortalContext";
import { AccountPage } from "../pages/AccountPage";
import { CguPage } from "../pages/CguPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LoginPage } from "../pages/LoginPage";
import { PendingValidationPage } from "../pages/PendingValidationPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { PortalsPage } from "../pages/PortalsPage";
import { RolesPage } from "../pages/RolesPage";
import { UsersPage } from "../pages/UsersPage";
import { ADMIN_PORTAL_PATHS } from "./adminPortalPaths";
import { AUTH_PORTAL_PATHS } from "./authPortalPaths";

const REDIRECT_TO_LOGIN = <Navigate to={AUTH_PORTAL_PATHS.login} replace />;

export function AuthPortalRoutes() {
  const { admin } = useAuthPortal().config;
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={AUTH_PORTAL_PATHS.root} element={REDIRECT_TO_LOGIN} />
        <Route path={AUTH_PORTAL_PATHS.login} element={<LoginPage />} />
        <Route path={AUTH_PORTAL_PATHS.register} element={<RegisterPage />} />
        <Route path={AUTH_PORTAL_PATHS.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={AUTH_PORTAL_PATHS.resetPassword} element={<ResetPasswordPage />} />
        <Route path={AUTH_PORTAL_PATHS.pending} element={<PendingValidationPage />} />
        <Route path={AUTH_PORTAL_PATHS.cgu} element={<CguPage />} />
        <Route path={AUTH_PORTAL_PATHS.account} element={<AccountPage />} />
        {admin && (
          <>
            <Route path={ADMIN_PORTAL_PATHS.users} element={<UsersPage />} />
            <Route path={ADMIN_PORTAL_PATHS.roles} element={<RolesPage />} />
            <Route path={ADMIN_PORTAL_PATHS.portals} element={<PortalsPage />} />
          </>
        )}
        <Route path="*" element={REDIRECT_TO_LOGIN} />
      </Route>
    </Routes>
  );
}
