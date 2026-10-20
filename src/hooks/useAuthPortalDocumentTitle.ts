import { useTranslation } from "@canop/ui";
import { useEffect } from "react";
import { useAuthPortal } from "../config/AuthPortalContext";

export function useAuthPortalDocumentTitle() {
  const { t } = useTranslation();
  const { config } = useAuthPortal();
  const title = t("auth.documentTitle", { appName: config.appName });

  useEffect(() => {
    document.title = title;
  }, [title]);
}
