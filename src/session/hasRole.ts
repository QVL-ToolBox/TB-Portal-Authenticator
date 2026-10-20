import type { Me } from "../api/authApi";

export function hasRole(user: Me, role: string): boolean {
  return Array.isArray(user.roles) && user.roles.includes(role);
}
