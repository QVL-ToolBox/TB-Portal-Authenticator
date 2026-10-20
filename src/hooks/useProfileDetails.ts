import type { Me } from "../api/authApi";
import { useFormattedDate } from "./useFormattedDate";

export function useProfileDetails(me: Me) {
  const createdAt = useFormattedDate(me.created_at);

  return {
    hasRoles: me.roles.length > 0,
    roleItems: me.roles.map((role) => ({ key: role, content: role })),
    createdAt,
  };
}
