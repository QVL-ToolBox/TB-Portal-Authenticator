import { BulletList, DescriptionList, Text, useTranslation } from "@canop/ui";
import type { Me } from "../api/authApi";
import { useProfileDetails } from "../hooks/useProfileDetails";

export interface ProfileDetailsProps {
  me: Me;
}

export function ProfileDetails({ me }: ProfileDetailsProps) {
  const { t } = useTranslation();
  const { hasRoles, roleItems, createdAt } = useProfileDetails(me);
  const roles = hasRoles ? (
    <BulletList items={roleItems} />
  ) : (
    <Text as="em">{t("auth.account.noRoles")}</Text>
  );

  return (
    <DescriptionList
      items={[
        { label: t("auth.account.name"), value: me.name },
        { label: t("auth.account.email"), value: me.email },
        { label: t("auth.account.roles"), value: roles },
        { label: t("auth.account.createdAt"), value: createdAt },
      ]}
    />
  );
}
