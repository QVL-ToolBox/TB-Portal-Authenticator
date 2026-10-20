import { useCurrentUser } from "@canop/ui";
import type { Me } from "../api/authApi";

export function useCurrentAdmin(): Me {
  return useCurrentUser<Me>();
}
