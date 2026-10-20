import { InputEmail, InputPassword, InputText, NAME_REGEX, useTranslation } from "@canop/ui";
import type { UserEditor } from "../hooks/useUserEditor";

export interface UserIdentityFieldsProps {
  editor: UserEditor;
}

export function UserIdentityFields({ editor }: UserIdentityFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <InputText
        label={t("auth.field.name")}
        value={editor.name}
        onChange={editor.setName}
        required
        pattern={NAME_REGEX}
        patternMessage={t("auth.field.nameInvalid")}
      />
      <InputEmail
        label={t("auth.field.email")}
        value={editor.email}
        onChange={editor.setEmail}
        required
      />
      <InputPassword
        label={t("auth.admin.users.passwordLabel")}
        value={editor.password}
        onChange={editor.setPassword}
        autoComplete="new-password"
      />
    </>
  );
}
