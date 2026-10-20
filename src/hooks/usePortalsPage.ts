import { useMemo } from "react";
import { distinctErrors } from "./distinctErrors";
import { usePortalLabel } from "./usePortalLabel";
import { usePortals } from "./usePortals";

export function usePortalsPage() {
  const { portals, loading, error } = usePortals();
  const portalLabel = usePortalLabel();
  const items = useMemo(
    () => portals.map((portal) => ({ portal, label: portalLabel(portal.name) })),
    [portalLabel, portals],
  );

  return {
    items,
    loading,
    errors: distinctErrors([error]),
    isEmpty: !loading && error === null && items.length === 0,
  };
}
