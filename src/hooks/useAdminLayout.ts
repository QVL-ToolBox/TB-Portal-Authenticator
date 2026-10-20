import { useLogout, useTranslation } from "@canop/ui";
import { createElement } from "react";
import { AdminFooter } from "../components/AdminFooter";
import { useAdminPortal } from "../config/AdminPortalContext";
import { useAdminPortalNav } from "./useAdminPortalNav";
import { useCurrentAdmin } from "./useCurrentAdmin";

const DEFAULT_FOOTER = createElement(AdminFooter);

export function useAdminLayout() {
  const { t } = useTranslation();
  const { config, api, session } = useAdminPortal();
  const me = useCurrentAdmin();
  const nav = useAdminPortalNav();
  const logout = useLogout({ logout: api.logout, loginUrl: session.loginUrl });
  const { footer } = config.branding;

  return {
    ...nav,
    navbarTitle: config.appName,
    title: t("auth.admin.brand"),
    userName: me.name,
    onLogout: logout,
    infoHref: session.cguUrl(),
    footer: footer === undefined ? DEFAULT_FOOTER : footer,
  };
}
