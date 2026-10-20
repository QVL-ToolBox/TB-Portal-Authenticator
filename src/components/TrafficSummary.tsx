import { Stack, Text, useTranslation } from "@canop/ui";
import type { AdminTraffic } from "../api/adminApi";
import { usePortalLabel } from "../hooks/usePortalLabel";
import { TrafficMetricRow } from "./TrafficMetricRow";

export interface TrafficSummaryProps {
  traffic: AdminTraffic;
}

export function TrafficSummary({ traffic }: TrafficSummaryProps) {
  const { t } = useTranslation();
  const portalLabel = usePortalLabel();

  return (
    <Stack gap="sm">
      <TrafficMetricRow
        label={t("auth.admin.dashboard.registrationsLabel")}
        value={traffic.registrations}
        emphasized
      />
      <Text weight="semibold">{t("auth.admin.dashboard.connectedLabel")}</Text>
      <Stack gap="xs" role="list">
        {traffic.portals.map((portal) => (
          <Stack key={portal.portal} role="listitem">
            <TrafficMetricRow label={portalLabel(portal.portal)} value={portal.connected_users} />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
