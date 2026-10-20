import { useMemo } from "react";
import type { AdminPortal, AdminRole } from "../api/adminApi";
import { usePortalLabel } from "./usePortalLabel";

export interface PortalRoleGroup {
  portal: AdminPortal;
  label: string;
  subRoles: AdminRole[];
}

export function usePortalRoleGroups(
  portals: readonly AdminPortal[],
  roles: readonly AdminRole[],
): PortalRoleGroup[] {
  const portalLabel = usePortalLabel();

  return useMemo(
    () =>
      portals.map((portal) => ({
        portal,
        label: portalLabel(portal.name),
        subRoles: roles.filter((role) => role.portal === portal.name && role.kind === "sub"),
      })),
    [portalLabel, portals, roles],
  );
}
