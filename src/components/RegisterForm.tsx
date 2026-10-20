import {
  Checkbox,
  Form,
  InputEmail,
  InputPassword,
  InputText,
  NAME_REGEX,
  PASSWORD_MIN_LENGTH,
  useTranslation,
} from "@canop/ui";
import { useRegister } from "../hooks/useRegister";
import { AUTH_PORTAL_PATHS } from "../routes/authPortalPaths";
import { AppLink } from "./AppLink";

export function RegisterForm() {
  const { t } = useTranslation();
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    termsAccepted,
    acceptTerms,
    termsError,
    submitDisabled,
    error,
    loading,
    submit,
  } = useRegister();

  return (
    <Form
      onSubmit={submit}
      submitLabel={t("auth.register.submit")}
      loading={loading}
      submitDisabled={submitDisabled}
      error={error}
    >
      <InputText
        label={t("auth.field.name")}
        value={name}
        onChange={setName}
        required
        pattern={NAME_REGEX}
        patternMessage={t("auth.field.nameInvalid")}
      />
      <InputEmail label={t("auth.field.email")} value={email} onChange={setEmail} required />
      <InputPassword
        label={t("auth.field.password")}
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        helperText={t("auth.field.passwordHint", { min: PASSWORD_MIN_LENGTH })}
        required
      />
      <InputPassword
        label={t("auth.field.passwordConfirm")}
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        showStrength={false}
        required
      />
      <Checkbox
        checked={termsAccepted}
        onChange={acceptTerms}
        required
        error={termsError}
        label={t("auth.register.terms.intro")}
        sublabel={
          <AppLink to={AUTH_PORTAL_PATHS.cgu} newTab subtitle>
            {t("auth.register.terms.linkText")}
          </AppLink>
        }
      />
    </Form>
  );
}
