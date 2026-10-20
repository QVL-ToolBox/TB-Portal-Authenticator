import { Feedback, Form, InputPassword, PASSWORD_MIN_LENGTH, useTranslation } from "@canop/ui";
import { AuthNav } from "../components/AuthNav";
import { AuthPageContent } from "../components/AuthPageContent";
import { useResetPassword } from "../hooks/useResetPassword";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token, password, setPassword, confirm, setConfirm, error, loading, submit } =
    useResetPassword();

  if (!token) {
    return (
      <AuthPageContent
        title={t("auth.reset.title")}
        footer={
          <AuthNav
            links={[{ to: AUTH_PORTAL_PATHS.forgotPassword, label: t("auth.link.newRequest") }]}
          />
        }
      >
        <Feedback severity="error">{t("auth.reset.tokenMissing")}</Feedback>
      </AuthPageContent>
    );
  }

  return (
    <AuthPageContent
      title={t("auth.reset.title")}
      footer={<AuthNav links={[{ to: AUTH_PORTAL_PATHS.login, label: t("auth.link.login") }]} />}
    >
      <Form onSubmit={submit} submitLabel={t("auth.reset.submit")} loading={loading} error={error}>
        <InputPassword
          label={t("auth.field.newPassword")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          helperText={t("auth.field.passwordHint", { min: PASSWORD_MIN_LENGTH })}
          required
        />
        <InputPassword
          label={t("auth.field.confirm")}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
        />
      </Form>
    </AuthPageContent>
  );
}
