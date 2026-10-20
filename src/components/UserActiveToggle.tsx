import { Toggle, useTranslation } from "@canop/ui";
import type { AdminUser } from "../api/adminApi";

export interface UserActiveToggleProps {
  user: AdminUser;
  onToggle: (user: AdminUser, active: boolean) => void;
}

export function UserActiveToggle({ user, onToggle }: UserActiveToggleProps) {
  const { t } = useTranslation();
  const active = user.status === "active";
  const labelKey = active ? "auth.admin.users.action.disable" : "auth.admin.users.action.activate";

  return (
    <Toggle
      checked={active}
      onChange={(checked) => onToggle(user, checked)}
      size="small"
      color="primary"
      ariaLabel={t(labelKey, { name: user.name })}
    />
  );
}
