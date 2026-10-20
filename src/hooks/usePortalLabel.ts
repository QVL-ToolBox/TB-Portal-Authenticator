import { useTranslation } from "@canop/ui";
import { useCallback } from "react";

export type PortalLabeler = (portalName: string) => string;

export function usePortalLabel(): PortalLabeler {
  const { t } = useTranslation();

  return useCallback<PortalLabeler>(
    (portalName) => {
      const key = `auth.admin.portal.${portalName}`;
      const label = t(key);
      return label === key ? portalName : label;
    },
    [t],
  );
}
