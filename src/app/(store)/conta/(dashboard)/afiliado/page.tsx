'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Link2, Copy, TrendingUp, DollarSign, MousePointerClick,
  CheckCircle, Clock, QrCode, Plus, X, Loader2, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// ---- Types ----

type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled'
type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected'

interface Commission {
  id: string
  amount: number
  rate: number
  status: CommissionStatus
  createdAt: string
}

interface PayoutRequest {
  id: string
  amount: number
  method?: string
  status: PayoutStatus
  createdAt: string
}

interface AffiliateLink {
  id: string
  name: string
  slug: string
  url: string
  clicks: number
  conversions: number
  createdAt: string
}

interface Affiliate {
  id: string
  code: string
  link: string
  qrCode?: string | null
  status: string
  commissionType: string
  commissionRate: number
  totalClicks: number
  totalSales: number
  totalEarned: number
  totalPaid: number
  balance: number
  pendingBalance: number
  commissions: Commission[]
  payoutRequests: PayoutRequest[]
  links: AffiliateLink[]
}

// ---- Constants ----

const AFFILIATE_STATUS_LABELS: Record<string, string> = {
  pending:   'Pendente de aprovação',
  active:    'Activo',
  inactive:  'Inactivo',
  suspended: 'Suspenso',
}

const COMMISSION_STATUS_COLORS: Record<CommissionStatus, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending:   'Pendente',
  approved:  'Aprovado',
  paid:      'Pago',
  cancelled: 'Cancelado',
}

const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid:     'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  pending:  'Pendente',
  approved: 'Aprovado',
  paid:     'Pago',
  rejected: 'Rejeitado',
}

type Tab = 'dashboard' | 'links' | 'comissoes' | 'pagamentos'

// ---- Main component ----

export default function AfiliadoPage() {
  const [affiliate, setAffiliate] = useState<Affiliate | null | undefined>(undefined)
  const [applying, setApplying] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [copied, setCopied] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('')
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [newLinkName, setNewLinkName] = useState('')
  const [newLinkTarget, setNewLinkTarget] = useState<'homepage' | 'product' | 'category'>('homepage')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [creatingLink, setCreatingLink] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/conta/affiliate')
      const data = await res.json()
      setAffiliate(data ?? null)
    } catch {
      setAffiliate(null)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function apply() {
    setApplying(true)
    try {
      await fetch('/api/conta/affiliate', { method: 'POST' })
      await load()
    } finally {
      setApplying(false)
    }
  }

  function copyLink() {
    if (!affiliate?.link) return
    navigator.clipboard.writeText(affiliate.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function requestPayout() {
    if (!payoutAmount || Number(payoutAmount) <= 0) return
    setSubmittingPayout(true)
    try {
      const res = await fetch('/api/conta/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(payoutAmount), method: payoutMethod }),
      })
      if (res.ok) {
        await load()
        setShowPayoutModal(false)
        setPayoutAmount('')
        setPayoutMethod('')
      }
    } finally {
      setSubmittingPayout(false)
    }
  }

  async function createLink() {
    if (!newLinkName.trim()) return
    setCreatingLink(true)
    try {
      const res = await fetch('/api/conta/affiliate/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLinkName, targetType: newLinkTarget, url: newLinkUrl }),
      })
      if (res.ok) {
        await load()
        setShowLinkForm(false)
        setNewLinkName('')
        setNewLinkUrl('')
      }
    } finally {
      setCreatingLink(false)
    }
  }

  // ---- Loading state ----
  if (affiliate === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  // ---- No affiliate — join CTA ----
  if (!affiliate) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Junte-se ao Programa de Afiliados</h2>
          <p className="text-gray-500 text-sm mb-6">
            Ganhe comissões por cada venda realizada através do seu link de indicação.
            Partilhe com amigos e família e acumule ganhos automaticamente.
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
          <Button
            onClick={apply}
            disabled={applying}
            className="bg-orange-500 hover:bg-orange-600 w-full"
          >
            {applying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A candidatar...</> : 'Candidatar-me como Afiliado'}
          </Button>
          <p className="text-xs text-gray-400 mt-3">A candidatura será analisada em 24–48h</p>
        </div>
      </div>
    )
  }

  const pendingEarnings = Number(affiliate.totalEarned) - Number(affiliate.totalPaid)
  const conversionRate = affiliate.totalClicks > 0
    ? ((affiliate.totalSales / affiliate.totalClicks) * 100).toFixed(1)
    : '0.0'

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'links',      label: 'Links' },
    { id: 'comissoes',  label: 'Comissões' },
    { id: 'pagamentos', label: 'Pagamentos' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          affiliate.status === 'active'    ? 'bg-green-100 text-green-700' :
          affiliate.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
          affiliate.status === 'suspended' ? 'bg-red-100 text-red-700' :
                                             'bg-gray-100 text-gray-600'
        }`}>
          {AFFILIATE_STATUS_LABELS[affiliate.status] ?? affiliate.status}
        </span>
      </div>

      {affiliate.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          A sua candidatura está a ser analisada. Receberá uma notificação quando for aprovada.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-full overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* 4 stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: 'Total Ganho', value: `${Number(affiliate.totalEarned).toLocaleString('pt-AO')} AOA`, color: 'text-orange-600 bg-orange-50' },
              { icon: MousePointerClick, label: 'Cliques', value: affiliate.totalClicks, color: 'text-blue-600 bg-blue-50' },
              { icon: TrendingUp, label: 'Conversões', value: affiliate.totalSales, color: 'text-green-600 bg-green-50' },
              { icon: CheckCircle, label: 'Taxa Conversão', value: `${conversionRate}%`, color: 'text-purple-600 bg-purple-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Balance progress */}
          {affiliate.status === 'active' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">Saldo Disponível</h3>
                <Button
                  size="sm"
                  onClick={() => setShowPayoutModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                >
                  Solicitar Pagamento
                </Button>
              </div>
              <p className="text-2xl font-bold text-orange-600 mb-3">
                {Number(affiliate.balance ?? pendingEarnings).toLocaleString('pt-AO')} AOA
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Disponível</span>
                  <span>{Number(affiliate.totalPaid).toLocaleString('pt-AO')} AOA pago</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{
                      width: Number(affiliate.totalEarned) > 0
                        ? `${(Number(affiliate.totalPaid) / Number(affiliate.totalEarned)) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main affiliate link */}
          {affiliate.status === 'active' && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-orange-500" /> Link Principal de Afiliado
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
        </div>
      )}

      {/* Tab: Links */}
      {activeTab === 'links' && (
        <div className="space-y-4">
          {/* QR Code */}
          {affiliate.qrCode && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={affiliate.qrCode} alt="QR Code de Afiliado" className="w-24 h-24 rounded-lg border border-gray-200" />
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-orange-500" /> QR Code
                </h3>
                <p className="text-sm text-gray-500">Partilhe este QR code para rastrear visitas offline.</p>
              </div>
            </div>
          )}

          {/* Main link */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-orange-500" /> Link de Referência Principal
            </h3>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-700 flex-1 truncate">{affiliate.link}</span>
              <Button size="sm" variant="outline" onClick={copyLink} className="flex-shrink-0">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          {/* Custom links */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Links Personalizados</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLinkForm(!showLinkForm)}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Novo Link
              </Button>
            </div>

            {showLinkForm && (
              <div className="p-4 border-b border-gray-100 bg-orange-50 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Nome do Link</label>
                    <input
                      value={newLinkName}
                      onChange={e => setNewLinkName(e.target.value)}
                      placeholder="Ex: Instagram Bio"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Destino</label>
                    <select
                      value={newLinkTarget}
                      onChange={e => setNewLinkTarget(e.target.value as 'homepage' | 'product' | 'category')}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="homepage">Página Inicial</option>
                      <option value="product">Produto</option>
                      <option value="category">Categoria</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">URL (opcional)</label>
                    <input
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      placeholder="/produtos/nome-do-produto"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowLinkForm(false)}>Cancelar</Button>
                  <Button
                    size="sm"
                    onClick={createLink}
                    disabled={creatingLink || !newLinkName.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {creatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Link'}
                  </Button>
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {(affiliate.links ?? []).length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">Sem links personalizados.</p>
              ) : (affiliate.links ?? []).map(link => (
                <div key={link.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{link.name}</p>
                    <p className="text-xs text-gray-500 truncate">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                    <span>{link.clicks} cliques</span>
                    <span>{link.conversions} conv.</span>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(link.url) }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Comissões */}
      {activeTab === 'comissoes' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Histórico de Comissões</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Taxa</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {affiliate.commissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                      Ainda não tem comissões.
                    </td>
                  </tr>
                ) : affiliate.commissions.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="py-3 px-4 font-bold text-green-600">
                      +{Number(c.amount).toLocaleString('pt-AO')} AOA
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.rate}%</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMMISSION_STATUS_COLORS[c.status]}`}>
                        {COMMISSION_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Pagamentos */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setShowPayoutModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-1" /> Solicitar Pagamento
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Histórico de Pagamentos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Método</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(affiliate.payoutRequests ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                        Sem pedidos de pagamento.
                      </td>
                    </tr>
                  ) : (affiliate.payoutRequests ?? []).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('pt-AO')}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {Number(p.amount).toLocaleString('pt-AO')} AOA
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{p.method ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYOUT_STATUS_COLORS[p.status]}`}>
                          {PAYOUT_STATUS_LABELS[p.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payout modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">Solicitar Pagamento</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-orange-50 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-orange-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Saldo disponível: <strong>{Number(affiliate.balance ?? pendingEarnings).toLocaleString('pt-AO')} AOA</strong>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700 font-medium mb-1 block">Valor a solicitar (AOA)</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 font-medium mb-1 block">Método de Pagamento</label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seleccionar método</option>
                  <option value="multicaixa">Multicaixa Express</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="cash">Numerário</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setShowPayoutModal(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={requestPayout}
                disabled={submittingPayout || !payoutAmount || Number(payoutAmount) <= 0}
              >
                {submittingPayout ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Solicitar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
