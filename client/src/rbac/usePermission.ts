import { useAuth } from "../context/AuthContext";
import { can, canAll, canAny } from "./engine";
 
export function usePermission() {
  const { user } = useAuth();
  const roles: string[] = user?.roles ?? [];
 
  return {
    can:    (permission: string) => can(roles, permission),
    canAll: (...perms: string[]) => canAll(roles, perms),
    canAny: (...perms: string[]) => canAny(roles, perms),
    roles,
  };
}
