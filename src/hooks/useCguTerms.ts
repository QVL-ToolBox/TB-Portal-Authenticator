import { useTranslation } from "@canop/ui";
import { useAuthPortal } from "../config/AuthPortalContext";
import { useFormattedDate } from "./useFormattedDate";

export function useCguTerms() {
  const { t } = useTranslation();
  const { config } = useAuthPortal();
  const { version, effectiveDate, sections } = config.terms;
  const formattedDate = useFormattedDate(effectiveDate);
  const appNameParams = { appName: config.appName };

  return {
    versionLabel: t("auth.cgu.versionLabel", { version, date: formattedDate }),
    sections,
    translateSection: (key: string) => t(`auth.cgu.${key}`, appNameParams),
  };
}
