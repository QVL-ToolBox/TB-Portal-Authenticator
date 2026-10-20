import { Card, Stack, Text, Toggle, useTranslation } from "@canop/ui";

export interface RegistrationToggleCardProps {
  enabled: boolean;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function RegistrationToggleCard({
  enabled,
  disabled,
  onChange,
}: RegistrationToggleCardProps) {
  const { t } = useTranslation();
  const label = t("auth.admin.dashboard.registrationToggle");

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="md" wrap>
        <Text as="span" weight="semibold">
          {label}
        </Text>
        <Toggle
          checked={enabled}
          onChange={onChange}
          disabled={disabled}
          color="primary"
          ariaLabel={label}
        />
      </Stack>
    </Card>
  );
}
