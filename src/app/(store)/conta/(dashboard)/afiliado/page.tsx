'use client'
import { useState, useEffect, useCallback } from 'react'
import { Users, Link2, Copy, TrendingUp, DollarSign, MousePointerClick, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Commission {
  id: string
  amount: number
  rate: number
  status: string
  createdAt: string
}

interface Affiliate {
  id: string
  code: string
  link: string
  status: string
  commissionType: string
  commissionRate: number
  totalClicks: number
  totalSales: number
  totalEarned: number
  totalPaid: number
  commissions: Commission[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pendente de aprovação',
  active: '✅ Activo',
  inactive: '⏸️ Inactivo',
  suspended: '🚫 Suspenso',
}

export default function AfiliadoPage() {
  const [affiliate, setAffiliate] = useState<Affiliate | null | undefined>(undefined)
  const [applying, setApplying] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/conta/affiliate')
    const data = await res.json()
    setAffiliate(data)
  }, [])

  useEffect(() => { load() }, [load])

  async function apply() {
    setApplying(true)
    await fetch('/api/conta/affiliate', { method: 'POST' })
    await load()
    setApplying(false)
  }

  function copyLink() {
    if (!affiliate?.link) return
    navigator.clipboard.writeText(affiliate.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (affiliate === undefined) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
  }

  if (!affiliate) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-lg mx-auto">
          <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Torne-se um Afiliado</h2>
          <p className="text-gray-500 text-sm mb-6">
            Ganhe comissões por cada venda realizada através do seu link de indicação.
            Partilhe com amigos e família e acumule ganhos.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            {[
              { icon: '🔗', title: 'Link Único', desc: 'Link personalizado para partilhar' },
              { icon: '💰', title: 'Comissões', desc: 'Ganhe % em cada venda' },
              { icon: '📊', title: 'Dashboard', desc: 'Acompanhe em tempo real' },
            ].map(item => (
              <div key={item.title}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <Button onClick={apply} disabled={applying} className="bg-orange-500 hover:bg-orange-600 w-full">
            {applying ? 'A candidatar...' : 'Candidatar-me como Afiliado'}
          </Button>
          <p className="text-xs text-gray-400 mt-3">A candidatura será analisada em 24–48h</p>
        </div>
      </div>
    )
  }

  const pendingEarnings = Number(affiliate.totalEarned) - Number(affiliate.totalPaid)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          affiliate.status === 'active' ? 'bg-green-100 text-green-700'
          : affiliate.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
          : 'bg-gray-100 text-gray-600'
        }`}>
          {STATUS_LABELS[affiliate.status] ?? affiliate.status}
        </span>
      </div>

      {affiliate.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          A sua candidatura está a ser analisada. Receberá uma notificação quando for aprovada.
        </div>
      )}

      {/* Link */}
      {affiliate.status === 'active' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-orange-500" /> O Seu Link de Afiliado
          </h3>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-700 flex-1 truncate">{affiliate.link}</span>
            <Button size="sm" variant="outline" onClick={copyLink} className="flex-shrink-0">
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Código: <strong>{affiliate.code}</strong></p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: MousePointerClick, label: 'Cliques', value: affiliate.totalClicks, color: 'text-blue-600' },
          { icon: TrendingUp, label: 'Vendas', value: affiliate.totalSales, color: 'text-green-600' },
          { icon: DollarSign, label: 'Total Ganho', value: `${Number(affiliate.totalEarned).toLocaleString()} AOA`, color: 'text-orange-600' },
          { icon: DollarSign, label: 'Por Receber', value: `${pendingEarnings.toLocaleString()} AOA`, color: 'text-purple-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Commission rate */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Configuração de Comissão</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-orange-50 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-gray-500">Tipo</p>
            <p className="font-semibold text-orange-600">{affiliate.commissionType === 'percentage' ? 'Percentagem' : 'Valor Fixo'}</p>
          </div>
          <div className="bg-orange-50 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-gray-500">Taxa</p>
            <p className="font-semibold text-orange-600">
              {affiliate.commissionType === 'percentage' ? `${affiliate.commissionRate}%` : `${Number(affiliate.commissionRate).toLocaleString()} AOA`}
            </p>
          </div>
        </div>
      </div>

      {/* Commission history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Histórico de Comissões</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {affiliate.commissions.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Ainda não tem comissões.</p>
          ) : (
            affiliate.commissions.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-gray-700">Comissão de venda</p>
                  <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-AO')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">+{Number(c.amount).toLocaleString()} AOA</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'paid' ? 'bg-green-100 text-green-700'
                    : c.status === 'approved' ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>{c.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
