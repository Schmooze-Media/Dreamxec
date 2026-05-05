const { GRANTS } = require("./grants");
const { ROLE_INHERITANCE_MAP } = require("./inheritance");

/**
 * Returns the full set of permissions for a given role,
 * including all inherited role grants.
 *
 * @param {string} role - e.g. "ALUMNI"
 * @returns {string[]} - e.g. ["endorseCampaign", "donateToCampaign", "viewCampaigns", ...]
 */
function getPermissions(role) {
  const chain = ROLE_INHERITANCE_MAP[role] || [];
  const permissions = new Set();

  for (const r of chain) {
    const grants = GRANTS[r] || [];
    for (const grant of grants) {
      permissions.add(grant);
    }
  }

  return [...permissions];
}

/**
 * Check if a role has a specific permission.
 *
 * @param {string} role - The user's role e.g. "ALUMNI"
 * @param {string} permission - e.g. "endorseCampaign"
 * @returns {boolean}
 */
function can(role, permission) {
  return getPermissions(role).includes(permission);
}

/**
 * Express middleware — gates a route by permission.
 *
 * Usage:
 *   router.post("/endorse", requirePermission("endorseCampaign"), handler)
 *
 * @param {string} permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(401).json({ message: "Unauthorized — no role found" });
    }

    if (!can(role, permission)) {
      return res.status(403).json({
        message: `Forbidden — "${role}" cannot perform "${permission}"`,
      });
    }

    next();
  };
}

module.exports = { getPermissions, can, requirePermission };
