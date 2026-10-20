import { useEffect, useState } from "react";
import type { AdminTraffic, TrafficPeriod } from "../api/adminApi";
import { useAdminApi } from "./useAdminApi";

export interface TrafficState {
  data: AdminTraffic | null;
  loading: boolean;
  failed: boolean;
}

const LOADING: TrafficState = { data: null, loading: true, failed: false };

export function useTraffic(period: TrafficPeriod): TrafficState {
  const api = useAdminApi();
  const [state, setState] = useState<TrafficState>(LOADING);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, failed: false }));
    api
      .getTraffic(period, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState((previous) => ({ ...previous, loading: false, failed: true }));
        }
      });
    return () => controller.abort();
  }, [api, period]);

  return state;
}
