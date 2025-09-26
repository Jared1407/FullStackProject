// Simple two-level org hierarchy helper
export function isSameOrChildOrg(userOrgId: number, resourceOrgId: number, orgMap: Record<number, number | null>): boolean {
  if (userOrgId === resourceOrgId) return true;
  const parent = orgMap[resourceOrgId];
  if (parent != null && parent === userOrgId) return true;
  return false;
}
