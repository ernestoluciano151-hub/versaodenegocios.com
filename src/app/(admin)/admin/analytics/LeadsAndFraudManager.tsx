'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Eye, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface FraudFlag {
  id: string
  reason: string
  riskLevel: string
  details: Record<string, unknown> | null
  resolved: boolean
  createdAt: string
  customer: { id: string; name: string; email: string }
}

interface Lead {
  id: string
  event: string
  metadata: Record<string, unknown> | null
  createdAt: string
  customer: { name: string; email: string } | null
  product: { name: string; slug: string } | null
}

interface ViewEntry {
  id: string
  viewedAt: string
  customer: { name: string; email: string } | null
  product: { name: string; slug: string }
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-yellow-100 text-yellow-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
}

export function LeadsAndFraudManager() {
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [views, setViews] = useState<ViewEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [f, l, v] = await Promise.all([
      fetch('/api/admin/fraud-flags').then(r => r.json()),
      fetch('/api/admin/leads').then(r => r.json()),
      fetch('/api/admin/view-history').then(r => r.json()),
    ])
    setFraudFlags(f)
    setLeads(l)
    setViews(v)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function resolveFlag(id: string) {
    await fetch('/api/admin/fraud-flags', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, resolved: true }) })
    load()
  }

  return (
    <Tabs defaultValue="fraud">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="fraud"><AlertTriangle className="w-4 h-4 mr-1" />Fraude ({fraudFlags.filter(f => !f.resolved).length})</TabsTrigger>
          <TabsTrigger value="leads"><TrendingUp className="w-4 h-4 mr-1" />Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="views"><Eye className="w-4 h-4 mr-1" />Visualizações ({views.length})</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Fraud Flags */}
      <TabsContent value="fraud">
        <div className="space-y-3">
          {fraudFlags.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">Nenhum flag de fraude.</div>
          ) : fraudFlags.map(f => (
            <div key={f.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${f.resolved ? 'border-gray-100 opacity-60' : 'border-red-100'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_COLORS[f.riskLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                    {f.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString('pt-PT')}</span>
                  {f.resolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Resolvido</span>}
                </div>
                <p className="font-medium text-gray-900 text-sm">{f.reason}</p>
                <p className="text-xs text-gray-500">{f.customer.name} · {f.customer.email}</p>
                {f.details && <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">{JSON.stringify(f.details, null, 2)}</pre>}
              </div>
              {!f.resolved && (
                <Button size="sm" onClick={() => resolveFlag(f.id)} className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0">
                  <CheckCircle className="w-4 h-4 mr-1" /> Resolver
                </Button>
              )}
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Leads */}
      <TabsContent value="leads">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Evento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nenhum lead registado.</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{l.event}</span></td>
                  <td className="px-4 py-3 text-gray-600">{l.customer?.name ?? <span className="text-gray-400">Anónimo</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{l.product?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(l.createdAt).toLocaleDateString('pt-PT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {/* View History */}
      <TabsContent value="views">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Visto em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {views.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Sem histórico de visualizações.</td></tr>
              ) : views.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.customer?.name ?? <span className="text-gray-400">Anónimo</span>}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(v.viewedAt).toLocaleString('pt-PT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  )
}
