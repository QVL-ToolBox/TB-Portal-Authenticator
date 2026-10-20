import { Feedback, Form, InputEmail, useTranslation } from "@canop/ui";
import { AuthNav } from "../components/AuthNav";
import { AuthPageContent } from "../components/AuthPageContent";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { email, setEmail, sent, loading, submit } = useForgotPassword();

  return (
    <AuthPageContent
      title={t("auth.forgot.title")}
      footer={<AuthNav links={[{ to: AUTH_PORTAL_PATHS.login, label: t("auth.link.login") }]} />}
    >
      {sent ? (
        <Feedback severity="info">{t("auth.forgot.sent")}</Feedback>
      ) : (
        <Form onSubmit={submit} submitLabel={t("auth.forgot.submit")} loading={loading}>
          <InputEmail label={t("auth.field.email")} value={email} onChange={setEmail} required />
        </Form>
      )}
    </AuthPageContent>
  );
}
