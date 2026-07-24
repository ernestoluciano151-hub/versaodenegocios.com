/**
 * permissions.ts — Tipos e utilitários RBAC (seguro para Client Components)
 *
 * Este ficheiro NÃO importa Prisma nem nenhum módulo Node.js.
 * É seguro para usar em Client Components (Sidebar, etc.).
 *
 * A função loadRolePermissions (que usa Prisma) está em permissions.server.ts.
 */

// ── Chaves de permissão ────────────────────────────────────────────────────────
export type PermissionKey =
  | 'canEditProducts'
  | 'canDeleteProducts'
  | 'canViewFinancial'
  | 'canIssueInvoices'
  | 'canCancelPayments'
  | 'canManageUsers'
  | 'canChangeSettings'
  | 'canApproveRequests'
  | 'canManageOrders'
  | 'canViewCustomers'
  | 'canManageInventory'

export type PermissionMap = Partial<Record<PermissionKey, boolean>>

/**
 * Verifica se um mapa de permissões tem uma determinada permissão.
 * Aceita null/undefined de forma segura.
 */
export function hasPermission(
  permissions: PermissionMap | null | undefined,
  key: PermissionKey,
): boolean {
  if (!permissions) return false
  return permissions[key] === true
}

/**
 * Verifica se o role é super-privilegiado (bypass de todas as verificações).
 */
export function isSuperRole(role: string | null | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}
