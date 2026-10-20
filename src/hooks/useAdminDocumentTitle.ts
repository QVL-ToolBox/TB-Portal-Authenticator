import { useTranslation } from "@canop/ui";
import { useEffect } from "react";
import { useAdminPortal } from "../config/AdminPortalContext";

export function useAdminDocumentTitle() {
  const { t } = useTranslation();
  const { config } = useAdminPortal();
  const title = t("auth.admin.documentTitle", { appName: config.appName });

  useEffect(() => {
    document.title = title;
  }, [title]);
}
