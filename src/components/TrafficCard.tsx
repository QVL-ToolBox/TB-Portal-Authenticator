import { Card, Feedback, SegmentedControl, Spinner, Stack, useTranslation } from "@canop/ui";
import { useTrafficCard } from "../hooks/useTrafficCard";
import { TrafficSummary } from "./TrafficSummary";

export function TrafficCard() {
  const { t } = useTranslation();
  const { title, period, setPeriod, periodOptions, traffic, loading, failed } = useTrafficCard();

  return (
    <Card title={title}>
      <Stack gap="md">
        <SegmentedControl
          options={periodOptions}
          value={period}
          onChange={setPeriod}
          ariaLabel={title}
          size="small"
          fullWidth
        />
        {loading && <Spinner ariaLabel={t("auth.loading")} />}
        {!loading && failed && (
          <Feedback severity="error">{t("auth.admin.dashboard.trafficError")}</Feedback>
        )}
        {!loading && !failed && traffic && <TrafficSummary traffic={traffic} />}
      </Stack>
    </Card>
  );
}
