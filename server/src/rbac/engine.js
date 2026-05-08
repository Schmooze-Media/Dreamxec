const { ROLE_INHERITANCE } = require("./inheritance");
const { ROLE_GRANTS } = require("./grants");

// process-lifetime cache - built once per role on first use
const _cache = new Map();
 
function resolveRole(role, visited = new Set()){
    if (_cache.has(role)) return _cache.get(role);

    if(visited.has(role)) return new Set(); //cicular guard
    visited.add(role);
    const effective = new Set();
    // walk parents first
    for (const parent of ROLE_INHERITANCE[role] ?? []){
        resolveRole(parent,visited).forEach(p => effective.add(p));
    }

    //then add own grants
    for(const perm of ROLE_GRANTS[role] ?? []){
        effective.add(perm);
    }
    
    _cache.set(role,effective);
    return effective;
}

function resolveUserPermissions(userRoles = []) {
  const effective = new Set();
  for (const role of userRoles) {
    resolveRole(role).forEach(p => effective.add(p));
  }
  return effective;
}

function can(userRoles, permission) {
    const perms = resolveUserPermissions(userRoles);
    return perms.has("*") || perms.has(permission);
}

function canAll(userRoles, permissions){
    return permissions.every(p => can(userRoles, p));
}

function canAny(userRoles, permissions){
    return permissions.some(p => can(userRoles, p));
}

//express middleware factories
function requirePermission(permission) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    if (!can(roles, permission)) {
      return res.status(403).json({ error: "Forbidden", required: permission });
    }
    next();
  };
}
 
function requireAll(...permissions) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    if (!canAll(roles, permissions)) {
      return res.status(403).json({ error: "Forbidden", required: permissions });
    }
    next();
  };
}
 
function requireAny(...permissions) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    if (!canAny(roles, permissions)) {
      return res.status(403).json({ error: "Forbidden", required: permissions });
    }
    next();
  };
}
 
// Debug — print what a role combination can actually do
function debugPermissions(userRoles) {
  return [...resolveUserPermissions(userRoles)].sort();
}

module.exports = {
  can, canAll, canAny,
  requirePermission, requireAll, requireAny,
  resolveUserPermissions, debugPermissions,
};