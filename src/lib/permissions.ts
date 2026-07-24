/**
 * permissions.ts — Sistema RBAC centralizado
 *
 * As permissões são carregadas da tabela `role_permissions` no login
 * e guardadas no JWT. Desta forma, a Sidebar, as páginas e as APIs
 * usam todas a mesma fonte de verdade — sem chamadas extra à DB por request.
 *
 * Se as permissões forem alteradas no painel, o utilizador precisa de
 * fazer logout/login para as obter (o JWT expira em 8h — aceitável).
 */

import { prisma } from '@/lib/prisma'

// ── Chaves de permissão (devem coincidir com a Matriz de Permissões) ──────────
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

// Permissões padrão por role (fallback se não houver registo na DB)
const ROLE_DEFAULTS: Record<string, PermissionMap> = {
  SUPER_ADMIN: {
    canEditProducts: true, canDeleteProducts: true, canViewFinancial: true,
    canIssueInvoices: true, canCancelPayments: true, canManageUsers: true,
    canChangeSettings: true, canApproveRequests: true, canManageOrders: true,
    canViewCustomers: true, canManageInventory: true,
  },
  ADMIN: {
    canEditProducts: true, canDeleteProducts: true, canViewFinancial: true,
    canIssueInvoices: true, canCancelPayments: true, canManageUsers: false,
    canChangeSettings: true, canApproveRequests: true, canManageOrders: true,
    canViewCustomers: true, canManageInventory: true,
  },
  FINANCIAL_MANAGER: {
    canViewFinancial: true, canIssueInvoices: true, canCancelPayments: true,
  },
  SALES_MANAGER: {
    canManageOrders: true, canApproveRequests: true,
    canViewCustomers: true, canManageInventory: true, canIssueInvoices: true,
  },
  MARKETING: { canEditProducts: true },
  SUPPORT: { canManageOrders: true, canViewCustomers: true },
  WAREHOUSE: { canManageInventory: true },
  OPERATOR: {},
}

/**
 * Carrega as permissões de um role da DB (com fallback para os defaults).
 * Chamado uma vez no login — resultado guardado no JWT.
 */
export async function loadRolePermissions(role: string): Promise<PermissionMap> {
  try {
    const record = await prisma.rolePermission.findUnique({ where: { role: role as never } })
    if (record?.permissions) return record.permissions as PermissionMap
  } catch {
    // Se a tabela ainda não existe ou outro erro, usa os defaults
  }
  return ROLE_DEFAULTS[role] ?? {}
}

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
