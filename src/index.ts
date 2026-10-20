export { AUTH_PORTALS_VERSION } from "./version";

export { AuthPortal, type AuthPortalProps } from "./AuthPortal";
export { AuthPortalShell, type AuthPortalShellProps } from "./AuthPortalShell";

export { DEFAULT_API_BASE_PATH, DEFAULT_ADMIN_API_BASE_PATH } from "./config/apiBasePathDefaults";
export {
  resolveAuthPortalConfig,
  DEFAULT_TERMS_SERVICES,
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  type AuthPortalConfig,
  type AuthPortalTerms,
  type AuthPortalBranding,
  type AuthPortalTheme,
  type PortalLayout,
  type PortalLayoutProps,
  type AuthPortalRedirectConfig,
  type ResolvedAuthPortalConfig,
  type ResolvedAuthPortalBranding,
  type ResolvedAuthPortalRedirect,
} from "./config/authPortalConfig";

export { createAuthApp } from "./createAuthApp";
export { AuthPortalConfigError } from "./config/AuthPortalConfigError";
export { defaultCguSections, type CguSection } from "./config/cguSections";
export {
  DEFAULT_FALLBACK_REDIRECT,
  DEFAULT_REDIRECT_COOKIE_NAME,
} from "./config/resolveAuthPortalRedirect";
export { safeRedirect, validateRedirectTarget, type RedirectPolicy } from "./redirect/safeRedirect";
export {
  getRedirectTarget,
  resolvePostLoginTarget,
  COOKIE_REDIRECT_INTENT,
  type PostLoginRedirectSources,
} from "./redirect/resolvePostLoginTarget";
export { readRedirectCookie } from "./redirect/redirectCookie";
export { loginRedirectPath } from "./redirect/loginRedirectPath";
export { usePostLoginTarget } from "./hooks/usePostLoginTarget";
export {
  AuthPortalContext,
  useAuthPortal,
  type AuthPortalContextValue,
} from "./config/AuthPortalContext";
export { AuthPortalProvider, type AuthPortalProviderProps } from "./config/AuthPortalProvider";

export {
  createAuthApi,
  type AuthApi,
  type Me,
  type RegisterPayload,
  type RegistrationSetting,
} from "./api/authApi";

export { AUTH_PORTAL_PATHS, type AuthPortalPath } from "./routes/authPortalPaths";
export { AuthPortalRoutes } from "./routes/AuthPortalRoutes";

export { authPortalMessages } from "./i18n/authPortalMessages";
export { mergeAuthPortalMessages } from "./i18n/mergeAuthPortalMessages";

export { useLogin } from "./hooks/useLogin";
export { useRegister } from "./hooks/useRegister";
export { useRegistrationEnabled } from "./hooks/useRegistrationEnabled";
export { useForgotPassword } from "./hooks/useForgotPassword";
export { useResetPassword } from "./hooks/useResetPassword";
export { useAccount } from "./hooks/useAccount";
export { useCguTerms } from "./hooks/useCguTerms";

export { AuthLayout } from "./components/AuthLayout";
export { AuthBrandLayout } from "./components/AuthBrandLayout";
export { AuthNav, type AuthNavItem, type AuthNavProps } from "./components/AuthNav";
export { AuthPageContent } from "./components/AuthPageContent";
export { AppLink, type AppLinkProps } from "./components/AppLink";
export { CguTerms } from "./components/CguTerms";
export { LegalNotice } from "./components/LegalNotice";
export { LegalSection, type LegalSectionProps } from "./components/LegalSection";
export { ProfileDetails, type ProfileDetailsProps } from "./components/ProfileDetails";
export { RegisterForm } from "./components/RegisterForm";

export { LoginPage } from "./pages/LoginPage";
export { RegisterPage } from "./pages/RegisterPage";
export { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
export { ResetPasswordPage } from "./pages/ResetPasswordPage";
export { PendingValidationPage } from "./pages/PendingValidationPage";
export { CguPage } from "./pages/CguPage";
export { AccountPage } from "./pages/AccountPage";

export {
  createAdminApi,
  type AdminApi,
  type AccountStatus,
  type AdminUser,
  type AdminUserDevice,
  type AdminUserList,
  type ListUsersParams,
  type UpdateUserPayload,
  type AdminRole,
  type AdminRoleKind,
  type CreateRolePayload,
  type AdminPortal,
  type TrafficPeriod,
  type PortalTraffic,
  type AdminTraffic,
} from "./api/adminApi";
export { adminErrorMessage } from "./api/adminErrors";
export { ADMIN_PORTAL_PATHS, type AdminPortalPath } from "./routes/adminPortalPaths";

export { useAdminApi } from "./hooks/useAdminApi";
export type { AdminToastMessage } from "./hooks/useAdminToast";
export { usePortals } from "./hooks/usePortals";
export { usePortalLabel } from "./hooks/usePortalLabel";
export { usePortalRoleGroups, type PortalRoleGroup } from "./hooks/usePortalRoleGroups";
export { useRoleCatalogue } from "./hooks/useRoleCatalogue";
export { useRoles } from "./hooks/useRoles";
export { useRoleDraft, type RoleDraft } from "./hooks/useRoleDraft";
export { useUsers, type UsersResource } from "./hooks/useUsers";
export { useUserEditor, type UserEditor, type UserEditorActions } from "./hooks/useUserEditor";
export { useRolesPage } from "./hooks/useRolesPage";
export { useUsersPage } from "./hooks/useUsersPage";
export { usePortalsPage } from "./hooks/usePortalsPage";

export { AdminNav } from "./components/AdminNav";
export { AdminPageContent, type AdminPageContentProps } from "./components/AdminPageContent";
export { PortalRolesCard, type PortalRolesCardProps } from "./components/PortalRolesCard";
export { PortalCard, type PortalCardProps } from "./components/PortalCard";
export { UsersTable, type UsersTableProps } from "./components/UsersTable";
export { UserEditPanel, type UserEditPanelProps } from "./components/UserEditPanel";

export { UsersPage } from "./pages/UsersPage";
export { RolesPage } from "./pages/RolesPage";
export { PortalsPage } from "./pages/PortalsPage";

export { createAdminApp } from "./createAdminApp";
export { AdminPortalApp, type AdminPortalAppProps } from "./AdminPortalApp";
export { AdminPortalShell, type AdminPortalShellProps } from "./AdminPortalShell";
export {
  resolveAdminPortalConfig,
  DEFAULT_ADMIN_ROLE,
  type AdminPortalConfig,
  type AdminPortalBranding,
  type AdminPortalRedirectConfig,
  type ResolvedAdminPortalConfig,
  type ResolvedAdminPortalBranding,
  type ResolvedAdminPortalRedirect,
} from "./config/adminPortalConfig";
export {
  AdminPortalContext,
  useAdminPortal,
  type AdminPortalContextValue,
  type AdminSession,
} from "./config/AdminPortalContext";
export { AdminPortalProvider, type AdminPortalProviderProps } from "./config/AdminPortalProvider";
export { ADMIN_APP_PATHS, type AdminAppPath } from "./routes/adminAppPaths";
export { AdminPortalRoutes } from "./routes/AdminPortalRoutes";
export { isSessionLostError } from "./session/isSessionLostError";
export { hasRole } from "./session/hasRole";

export { useAdminNav } from "./hooks/useAdminNav";
export { useAdminPortalNav } from "./hooks/useAdminPortalNav";
export { useAdminLayout } from "./hooks/useAdminLayout";
export { useRequireAdmin } from "./hooks/useRequireAdmin";
export { useCurrentAdmin } from "./hooks/useCurrentAdmin";
export { useDashboardPage } from "./hooks/useDashboardPage";
export { useDashboardStats, type DashboardStat } from "./hooks/useDashboardStats";
export { useRegistrationSetting } from "./hooks/useRegistrationSetting";
export { useTraffic, type TrafficState } from "./hooks/useTraffic";
export { useTrafficCard } from "./hooks/useTrafficCard";
export { useForbiddenPage } from "./hooks/useForbiddenPage";

export { RequireAdmin, type RequireAdminProps } from "./components/RequireAdmin";
export { AdminLayout } from "./components/AdminLayout";
export { AdminFooter } from "./components/AdminFooter";
export { DashboardStats, type DashboardStatsProps } from "./components/DashboardStats";
export { PendingUsersCard, type PendingUsersCardProps } from "./components/PendingUsersCard";
export {
  RegistrationToggleCard,
  type RegistrationToggleCardProps,
} from "./components/RegistrationToggleCard";
export { TrafficCard } from "./components/TrafficCard";

export { DashboardPage } from "./pages/DashboardPage";
export { ForbiddenPage } from "./pages/ForbiddenPage";
