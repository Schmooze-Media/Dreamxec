import { ROLE_INHERITANCE } from "./inheritance";
import { ROLE_GRANTS } from "./grants";

const _cache = new Map<string, Set<string>>();
 
function resolveRole(role: string, visited = new Set<string>()): Set<string> {
    if (_cache.has(role)) return _cache.get(role)!;

    if(visited.has(role)) return new Set<string>();
    visited.add(role);
    const effective = new Set<string>();
    for (const parent of ROLE_INHERITANCE[role] ?? []){
        resolveRole(parent,visited).forEach(p => effective.add(p));
    }

    for(const perm of ROLE_GRANTS[role] ?? []){
        effective.add(perm);
    }
    
    _cache.set(role,effective);
    return effective;
}

export function resolveUserPermissions(userRoles: string[] = []): Set<string> {
  const effective = new Set<string>();
  for (const role of userRoles) {
    resolveRole(role).forEach(p => effective.add(p));
  }
  return effective;
}

export function can(userRoles: string[], permission: string): boolean {
    const perms = resolveUserPermissions(userRoles);
    return perms.has("*") || perms.has(permission);
}

export function canAll(userRoles: string[], permissions: string[]): boolean {
    return permissions.every(p => can(userRoles, p));
}

export function canAny(userRoles: string[], permissions: string[]): boolean {
    return permissions.some(p => can(userRoles, p));
}
