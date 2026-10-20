import { Feedback, Spinner, useTranslation } from "@canop/ui";
import { AuthNav } from "../components/AuthNav";
import { AuthPageContent } from "../components/AuthPageContent";
import { RegisterForm } from "../components/RegisterForm";
import { useRegistrationEnabled } from "../hooks/useRegistrationEnabled";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function RegisterPage() {
  const { t } = useTranslation();
  const registrationEnabled = useRegistrationEnabled();

  return (
    <AuthPageContent
      title={t("auth.register.title")}
      footer={
        <AuthNav links={[{ to: AUTH_PORTAL_PATHS.login, label: t("auth.link.haveAccount") }]} />
      }
    >
      {registrationEnabled === null ? (
        <Spinner ariaLabel={t("auth.loading")} />
      ) : registrationEnabled ? (
        <RegisterForm />
      ) : (
        <Feedback severity="info">{t("auth.register.disabled")}</Feedback>
      )}
    </AuthPageContent>
  );
}
