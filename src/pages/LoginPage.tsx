import { Form, InputEmail, InputPassword, useTranslation } from "@canop/ui";
import { AuthNav } from "../components/AuthNav";
import { AuthPageContent } from "../components/AuthPageContent";
import { useLogin } from "../hooks/useLogin";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";

export function LoginPage() {
  const { t } = useTranslation();
  const { email, setEmail, password, setPassword, error, loading, submit } = useLogin();

  return (
    <AuthPageContent
      title={t("auth.login.title")}
      footer={
        <AuthNav
          links={[
            { to: AUTH_PORTAL_PATHS.forgotPassword, label: t("auth.link.forgot") },
            { to: AUTH_PORTAL_PATHS.register, label: t("auth.link.register") },
          ]}
        />
      }
    >
      <Form
        onSubmit={submit}
        submitLabel={t("auth.login.submit")}
        submitVariant="accent"
        loading={loading}
        error={error}
      >
        <InputEmail label={t("auth.field.email")} value={email} onChange={setEmail} required />
        <InputPassword
          label={t("auth.field.password")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
      </Form>
    </AuthPageContent>
  );
}
