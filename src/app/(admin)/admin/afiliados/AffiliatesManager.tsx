'use client'
import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw, Save, CheckCircle, XCircle, Users, TrendingUp, Clock, Ban } from 'lucide-react'
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
  _count: { clicks: number; commissions: number }
}

interface Stats {
  total: number
  active: number
  pending: number
  suspended: number
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo', pending: 'Pendente', inactive: 'Inactivo', suspended: 'Suspenso',
}

export function AffiliatesManager() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, suspended: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Affiliate | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/affiliates')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      // API returns { affiliates, total, stats }
      setAffiliates(Array.isArray(data) ? data : (data.affiliates ?? []))
      if (data.stats) setStats(data.stats)
    } catch {
      setAffiliates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!editing) return
    setSaving(true)
    try {
      await fetch(`/api/admin/affiliates/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editing.status,
          commissionType: editing.commissionType,
          commissionRate: editing.commissionRate,
          cookieDays: editing.cookieDays,
          notes: editing.notes,
        }),
      })
      setEditing(null)
      await load()
      showToast('Afiliado actualizado!')
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(affiliate: Affiliate, status: string) {
    await fetch(`/api/admin/affiliates/${affiliate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    showToast(status === 'active' ? 'Afiliado aprovado!' : 'Afiliado suspenso!')
  }

  const totalEarned = affiliates.reduce((s, a) => s + Number(a.totalEarned), 0)
  const totalPaid   = affiliates.reduce((s, a) => s + Number(a.totalPaid), 0)

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,     label: 'Total de Afiliados',  value: stats.total,                            color: 'text-gray-900' },
          { icon: CheckCircle, label: 'Activos',            value: stats.active,                          color: 'text-green-600' },
          { icon: Clock,     label: 'Pendentes',            value: stats.pending,                         color: 'text-yellow-600' },
          { icon: TrendingUp, label: 'Comissões Ganhas',   value: `${totalEarned.toLocaleString()} AOA`, color: 'text-orange-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="bg-white rounded-xl border border-orange-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Editar: {editing.customer.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Estado</label>
              <Select value={editing.status} onValueChange={v => setEditing(e => e ? { ...e, status: v } : e)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'active', 'inactive', 'suspended'].map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tipo de Comissão</label>
              <Select value={editing.commissionType} onValueChange={v => setEditing(e => e ? { ...e, commissionType: v } : e)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (AOA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Taxa</label>
              <Input
                type="number"
                step="0.5"
                value={editing.commissionRate}
                onChange={e => setEditing(ed => ed ? { ...ed, commissionRate: Number(e.target.value) } : ed)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cookie (dias)</label>
              <Input
                type="number"
                value={editing.cookieDays}
                onChange={e => setEditing(ed => ed ? { ...ed, cookieDays: Number(e.target.value) } : ed)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
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
          <h3 className="font-semibold text-gray-900">
            Lista de Afiliados
            {stats.pending > 0 && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                {stats.pending} pendente{stats.pending !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
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
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{a.code}</code>
                        <a href={a.link} target="_blank" rel="noopener noreferrer" title="Abrir link">
                          <ExternalLink className="w-3 h-3 text-gray-400 hover:text-orange-500" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'} border-0`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{a.totalClicks}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{a.totalSales}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      {Number(a.totalEarned).toLocaleString()} AOA
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {a.commissionType === 'percentage'
                        ? `${a.commissionRate}%`
                        : `${Number(a.commissionRate).toLocaleString()} AOA`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                          Editar
                        </Button>
                        {a.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => updateStatus(a, 'active')}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                        )}
                        {a.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => updateStatus(a, 'suspended')}
                          >
                            <Ban className="w-3 h-3 mr-1" /> Suspender
                          </Button>
                        )}
                        {a.status === 'suspended' && (
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => updateStatus(a, 'active')}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Reactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400">Nenhum afiliado ainda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
