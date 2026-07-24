/**
 * permissions.server.ts — Funções RBAC que dependem de Prisma (Server-only)
 *
 * NÃO importar em Client Components. Usar apenas em:
 *   - src/lib/auth.ts (no authorize callback)
 *   - src/lib/admin-auth.ts (no requirePermission)
 *   - Server Components e API routes
 */

import { prisma } from '@/lib/prisma'
import type { PermissionMap } from '@/lib/permissions'

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
