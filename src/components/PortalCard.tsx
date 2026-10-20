import { Card, DescriptionList, StatusChip, Text, useTranslation } from "@canop/ui";
import type { AdminPortal } from "../api/adminApi";

export interface PortalCardProps {
  portal: AdminPortal;
  label: string;
}

export function PortalCard({ portal, label }: PortalCardProps) {
  const { t } = useTranslation();

  return (
    <Card title={label} subtitle={portal.name} fill>
      <DescriptionList
        items={[
          {
            label: t("auth.admin.portals.audience"),
            value: <Text variant="code">{portal.audience}</Text>,
          },
          {
            label: t("auth.admin.portals.access"),
            value: portal.open ? (
              <StatusChip tone="info" label={t("auth.admin.portals.open")} />
            ) : (
              <StatusChip
                tone="neutral"
                label={t("auth.admin.portals.restricted", { role: portal.name })}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
