const { ROLES } = require("..rbac/roles");

/**
 * Recursively resolves all inherited roles for a given role.
 * Example: resolveInheritance("ALUMNI") → ["ALUMNI", "DONOR", "USER"]
 *
 * @param {string} roleName - The role to resolve
 * @param {Set} visited - Tracks visited roles to prevent circular inheritance
 * @returns {string[]} - Full list of roles including the role itself and all ancestors
 */
function resolveInheritance(roleName, visited = new Set()) {
  // Guard: unknown role
  if (!ROLES[roleName]) {
    throw new Error(`[RBAC] Unknown role: "${roleName}"`);
  }

  // Guard: circular inheritance protection
  if (visited.has(roleName)) {
    throw new Error(
      `[RBAC] Circular inheritance detected at role: "${roleName}"`,
    );
  }

  visited.add(roleName);

  const role = ROLES[roleName];
  let chain = [roleName];

  for (const parentRole of role.inherits) {
    const parentChain = resolveInheritance(parentRole, visited);
    // Merge without duplicates
    for (const r of parentChain) {
      if (!chain.includes(r)) {
        chain.push(r);
      }
    }
  }

  return chain;
}

/**
 * Pre-resolved inheritance map for all roles.
 * Built once at startup — no repeated computation at runtime.
 *
 * Example output:
 * {
 *   USER:              ["USER"],
 *   DONOR:             ["DONOR", "USER"],
 *   ALUMNI:            ["ALUMNI", "DONOR", "USER"],
 *   MENTOR:            ["MENTOR"],
 *   STUDENT_PRESIDENT: ["STUDENT_PRESIDENT", "USER"],
 *   ADMIN:             ["ADMIN"],
 * }
 */
const ROLE_INHERITANCE_MAP = {};

for (const roleName of Object.keys(ROLES)) {
  ROLE_INHERITANCE_MAP[roleName] = resolveInheritance(roleName);
}

/**
 * Check if a role has another role in its inheritance chain.
 * Example: hasRole("ALUMNI", "DONOR") → true
 *          hasRole("MENTOR", "DONOR") → false
 *
 * @param {string} userRole - The user's actual role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean}
 */
function hasRole(userRole, requiredRole) {
  if (!ROLE_INHERITANCE_MAP[userRole]) return false;
  return ROLE_INHERITANCE_MAP[userRole].includes(requiredRole);
}

module.exports = { ROLE_INHERITANCE_MAP, resolveInheritance, hasRole };
