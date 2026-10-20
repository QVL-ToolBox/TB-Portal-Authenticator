import { Feedback, useTranslation } from "@canop/ui";
import { AuthNav } from "../components/AuthNav";
import { AuthPageContent } from "../components/AuthPageContent";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function PendingValidationPage() {
  const { t } = useTranslation();

  return (
    <AuthPageContent
      title={t("auth.pending.title")}
      footer={<AuthNav links={[{ to: AUTH_PORTAL_PATHS.login, label: t("auth.link.login") }]} />}
    >
      <Feedback severity="info">{t("auth.pending.message")}</Feedback>
    </AuthPageContent>
  );
}
