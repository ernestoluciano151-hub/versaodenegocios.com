'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCIAL_MANAGER', label: 'Gestor Financeiro' },
  { value: 'SALES_MANAGER', label: 'Gestor de Vendas' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SUPPORT', label: 'Suporte' },
  { value: 'WAREHOUSE', label: 'Armazém' },
  { value: 'OPERATOR', label: 'Operador' },
]

const PERMISSIONS = [
  { key: 'canEditProducts', label: 'Editar Produtos' },
  { key: 'canDeleteProducts', label: 'Eliminar Produtos' },
  { key: 'canViewFinancial', label: 'Ver Financeiro' },
  { key: 'canIssueInvoices', label: 'Emitir Facturas' },
  { key: 'canCancelPayments', label: 'Cancelar Pagamentos' },
  { key: 'canManageUsers', label: 'Gerir Utilizadores' },
  { key: 'canChangeSettings', label: 'Alterar Definições' },
  { key: 'canApproveRequests', label: 'Aprovar Pedidos' },
  { key: 'canManageOrders', label: 'Gerir Encomendas' },
  { key: 'canViewCustomers', label: 'Ver Clientes' },
  { key: 'canManageInventory', label: 'Gerir Stock' },
]

function getDefaultPerms(role: string) {
  if (role === 'SUPER_ADMIN') return Object.fromEntries(PERMISSIONS.map((p) => [p.key, true]))
  if (role === 'ADMIN') return Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.key !== 'canManageUsers']))
  return Object.fromEntries(PERMISSIONS.map((p) => [p.key, false]))
}

interface Props {
  rolePermissions: any[]
}

export function PermissionsTab({ rolePermissions }: Props) {
  const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(() => {
    const map: Record<string, Record<string, boolean>> = {}
    for (const role of ROLES) {
      const existing = rolePermissions.find((r) => r.role === role.value)
      map[role.value] = existing?.permissions ?? getDefaultPerms(role.value)
    }
    return map
  })

  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function toggle(role: string, perm: string) {
    setPerms((p) => ({
      ...p,
      [role]: { ...p[role], [perm]: !p[role]?.[perm] },
    }))
  }

  async function saveRole(role: string) {
    setSavingRole(role)
    try {
      const res = await fetch('/api/admin/role-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, permissions: perms[role] }),
      })
      if (!res.ok) throw new Error()
      showToast('success', `Permissões de ${ROLES.find((r) => r.value === role)?.label} guardadas.`)
    } catch {
      showToast('error', 'Erro ao guardar permissões.')
    } finally {
      setSavingRole(null)
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Matriz de Permissões</h2>
          <p className="text-xs text-gray-400 mt-1">Configure as permissões por papel de utilizador</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase min-w-[160px]">Papel</th>
                {PERMISSIONS.map((p) => (
                  <th key={p.key} className="py-3 px-2 text-xs font-semibold text-gray-500 text-center min-w-[80px]">
                    <span className="inline-block text-left" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', maxHeight: 120 }}>
                      {p.label}
                    </span>
                  </th>
                ))}
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Guardar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ROLES.map((role) => {
                const isSaving = savingRole === role.value
                return (
                  <tr key={role.value} className="hover:bg-gray-50">
                    <td className="py-3 px-5">
                      <p className="font-medium text-gray-900 text-sm">{role.label}</p>
                      <p className="text-xs text-gray-400 font-mono">{role.value}</p>
                    </td>
                    {PERMISSIONS.map((perm) => (
                      <td key={perm.key} className="py-3 px-2 text-center">
                        <Checkbox
                          checked={!!perms[role.value]?.[perm.key]}
                          onCheckedChange={() => toggle(role.value, perm.key)}
                          className="mx-auto"
                        />
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        onClick={() => saveRole(role.value)}
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Guardar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
