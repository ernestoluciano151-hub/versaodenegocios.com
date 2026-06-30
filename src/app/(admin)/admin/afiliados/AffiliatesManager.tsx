'use client'
import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw, Save, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Affiliate {
  id: string
  code: string
  link: string
  status: string
  commissionType: string
  commissionRate: number
  cookieDays: number
  totalClicks: number
  totalSales: number
  totalEarned: number
  totalPaid: number
  notes: string | null
  customer: { name: string; email: string; phone: string | null }
  _count: { clicks: number; referrals: number; commissions: number }
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
}

export function AffiliatesManager() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [editing, setEditing] = useState<Affiliate | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/affiliates')
    const data = await res.json()
    setAffiliates(data)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing) return
    setSaving(true)
    await fetch('/api/admin/affiliates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    })
    setSaving(false)
    setEditing(null)
    await load()
    showToast('Afiliado actualizado!')
  }

  const totalEarned = affiliates.reduce((s, a) => s + Number(a.totalEarned), 0)
  const totalPaid = affiliates.reduce((s, a) => s + Number(a.totalPaid), 0)

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total de Afiliados</p>
          <p className="text-2xl font-bold">{affiliates.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-600">{affiliates.filter(a => a.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Comissões Ganhas</p>
          <p className="text-2xl font-bold text-orange-500">{totalEarned.toLocaleString()} AOA</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Comissões Pagas</p>
          <p className="text-2xl font-bold text-purple-600">{totalPaid.toLocaleString()} AOA</p>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="bg-white rounded-xl border border-orange-200 p-6 space-y-4">
          <h3 className="font-semibold">Editar: {editing.customer.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500">Estado</label>
              <Select value={editing.status} onValueChange={v => setEditing(e => e ? { ...e, status: v } : e)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'active', 'inactive', 'suspended'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Tipo de Comissão</label>
              <Select value={editing.commissionType} onValueChange={v => setEditing(e => e ? { ...e, commissionType: v } : e)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (AOA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Taxa</label>
              <Input type="number" step="0.5" className="mt-1" value={editing.commissionRate} onChange={e => setEditing(ed => ed ? { ...ed, commissionRate: Number(e.target.value) } : ed)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Validade Cookie (dias)</label>
              <Input type="number" className="mt-1" value={editing.cookieDays} onChange={e => setEditing(ed => ed ? { ...ed, cookieDays: Number(e.target.value) } : ed)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Lista de Afiliados</h3>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Atualizar</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-medium">
              <tr>
                <th className="px-4 py-3 text-left">Afiliado</th>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Cliques</th>
                <th className="px-4 py-3 text-right">Vendas</th>
                <th className="px-4 py-3 text-right">Ganhos</th>
                <th className="px-4 py-3 text-right">Comissão</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {affiliates.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.customer.name}</p>
                    <p className="text-xs text-gray-400">{a.customer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{a.code}</code>
                      <a href={a.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[a.status] ?? ''}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">{a.totalClicks}</td>
                  <td className="px-4 py-3 text-right">{a.totalSales}</td>
                  <td className="px-4 py-3 text-right font-medium text-orange-600">{Number(a.totalEarned).toLocaleString()} AOA</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {a.commissionType === 'percentage' ? `${a.commissionRate}%` : `${Number(a.commissionRate).toLocaleString()} AOA`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditing(a)}>Editar</Button>
                      {a.status === 'pending' && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={async () => {
                          await fetch('/api/admin/affiliates', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...a, status: 'active' }),
                          })
                          await load()
                          showToast('Afiliado aprovado!')
                        }}>
                          <CheckCircle className="w-3 h-3 mr-1" />Aprovar
                        </Button>
                      )}
                      {a.status === 'active' && (
                        <Button size="sm" variant="outline" className="text-red-500" onClick={async () => {
                          await fetch('/api/admin/affiliates', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...a, status: 'suspended' }),
                          })
                          await load()
                        }}>
                          <XCircle className="w-3 h-3 mr-1" />Suspender
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {affiliates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">Nenhum afiliado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
