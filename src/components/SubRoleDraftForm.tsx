import { IconActionButton, InputText, Stack, useTranslation } from "@canop/ui";
import type { RoleDraft } from "../hooks/useRoleDraft";

export interface SubRoleDraftFormProps {
  draft: RoleDraft;
}

export function SubRoleDraftForm({ draft }: SubRoleDraftFormProps) {
  const { t } = useTranslation();

  return (
    <Stack as="form" direction="row" alignItems="center" gap="xs" onSubmit={draft.submit}>
      <Stack fill>
        <InputText
          label={t("auth.admin.roles.namePlaceholder")}
          value={draft.name}
          onChange={draft.setName}
          size="small"
          autoFocus
          fullWidth
        />
      </Stack>
      <IconActionButton
        icon="save"
        ariaLabel={t("auth.admin.save")}
        onClick={() => void draft.save()}
        disabled={!draft.canSave}
        loading={draft.saving}
      />
      <IconActionButton
        icon="cancel"
        variant="secondary"
        ariaLabel={t("auth.admin.cancel")}
        onClick={draft.cancel}
      />
    </Stack>
  );
}
