import { useTranslation } from "@canop/ui";
import { AuthPageContent } from "../components/AuthPageContent";
import { CguTerms } from "../components/CguTerms";
import { LegalNotice } from "../components/LegalNotice";
import { useScrollToHash } from "../hooks/useScrollToHash";

export function CguPage() {
  const { t } = useTranslation();
  useScrollToHash();

  return (
    <AuthPageContent title={t("auth.cgu.title")}>
      <CguTerms />
      <LegalNotice />
    </AuthPageContent>
  );
}
