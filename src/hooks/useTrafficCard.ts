import { useTranslation, type CanopSegmentedControlOption } from "@canop/ui";
import { useMemo, useState } from "react";
import type { TrafficPeriod } from "../api/adminApi";
import { useTraffic } from "./useTraffic";

const TRAFFIC_PERIODS: readonly TrafficPeriod[] = ["day", "week", "month", "year"];
const DEFAULT_PERIOD: TrafficPeriod = "week";

export function useTrafficCard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TrafficPeriod>(DEFAULT_PERIOD);
  const { data, loading, failed } = useTraffic(period);

  const periodOptions = useMemo<CanopSegmentedControlOption<TrafficPeriod>[]>(
    () =>
      TRAFFIC_PERIODS.map((value) => ({
        value,
        label: t(`auth.admin.dashboard.period.${value}`),
      })),
    [t],
  );

  return {
    title: t("auth.admin.dashboard.trafficTitle"),
    period,
    setPeriod,
    periodOptions,
    traffic: data,
    loading,
    failed: failed || (!loading && data === null),
  };
}
