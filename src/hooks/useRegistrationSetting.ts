import { useAsyncResource } from "@canop/ui";
import { useCallback, useState } from "react";
import type { RegistrationSetting } from "../api/authApi";
import { useAdminApi } from "./useAdminApi";

const REGISTRATION_OPEN: RegistrationSetting = { enabled: true };

export function useRegistrationSetting() {
  const api = useAdminApi();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const { data, loading } = useAsyncResource<RegistrationSetting>({
    load: (signal) => api.getRegistrationSetting(signal),
    initial: REGISTRATION_OPEN,
  });

  const toggle = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      setSaving(true);
      try {
        const setting = await api.setRegistrationSetting(enabled);
        setSaved(setting.enabled);
        return true;
      } catch {
        return false;
      } finally {
        setSaving(false);
      }
    },
    [api],
  );

  return { enabled: saved ?? data.enabled, loading, saving, toggle };
}
