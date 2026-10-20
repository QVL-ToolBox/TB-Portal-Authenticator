import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOptionalAdminPortal } from "../config/AdminPortalContext";
import { loginRedirectPath } from "../redirect/loginRedirectPath";

export function useUnauthorizedRedirect(): () => void {
  const adminPortal = useOptionalAdminPortal();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const redirectToPortalLogin = adminPortal?.session.redirectToLogin;

  return useCallback(() => {
    if (redirectToPortalLogin) {
      redirectToPortalLogin();
      return;
    }
    navigate(loginRedirectPath(pathname), { replace: true });
  }, [navigate, pathname, redirectToPortalLogin]);
}
