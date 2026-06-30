'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, FunnelChart, Funnel, LabelList,
} from 'recharts'
import { Eye, ShoppingCart, TrendingUp, Users, DollarSign, MousePointerClick, Package, ArrowDown } from 'lucide-react'

const PERIODS = [
  { value: '1d', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
]

interface KPI {
  pageViews: number
  productViews: number
  addToCart: number
  checkoutStarted: number
  ordersCompleted: number
  totalOrders: number
  totalRevenue: number
  newCustomers: number
  avgTicket: number
  conversionRate: string
}

interface FunnelStep {
  name: string
  count: number
  pct: number
}

interface TopProduct {
  productId: string
  _sum: { quantity: number | null }
  product?: { id: string; name: string; price: number; images: string[] }
}

interface AnalyticsData {
  period: string
  kpis: KPI
  funnel: FunnelStep[]
  topProducts: TopProduct[]
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/analytics?period=${period}`)
    const d = await res.json()
    setData(d)
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const fmtNum = (n: number) => n.toLocaleString('pt-AO')
  const fmtMoney = (n: number) => `${fmtNum(Math.round(n))} AOA`

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-gray-100 rounded-xl" />
          <div className="h-72 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  const { kpis, funnel, topProducts } = data

  const kpiCards = [
    { icon: Eye, label: 'Visitas', value: fmtNum(kpis.pageViews), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Package, label: 'Produtos Vistos', value: fmtNum(kpis.productViews), color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: ShoppingCart, label: 'Carrinhos', value: fmtNum(kpis.addToCart), color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: TrendingUp, label: 'Pedidos', value: fmtNum(kpis.totalOrders), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: DollarSign, label: 'Receita', value: fmtMoney(kpis.totalRevenue), color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: Users, label: 'Novos Clientes', value: fmtNum(kpis.newCustomers), color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { icon: MousePointerClick, label: 'Ticket Médio', value: fmtMoney(kpis.avgTicket), color: 'text-pink-600', bg: 'bg-pink-50' },
    { icon: TrendingUp, label: 'Taxa Conversão', value: `${kpis.conversionRate}%`, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${period === p.value ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Funil de Conversão</h3>
        <div className="space-y-3">
          {funnel.map((step, i) => (
            <div key={step.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{step.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{fmtNum(step.count)}</span>
                  {i > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${step.pct > 50 ? 'bg-green-100 text-green-700' : step.pct > 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {step.pct}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-orange-500' : i === 3 ? 'bg-green-500' : 'bg-emerald-600'}`}
                  style={{ width: `${step.pct}%` }}
                />
              </div>
              {i < funnel.length - 1 && (
                <div className="flex justify-center mt-1">
                  <ArrowDown className="w-3 h-3 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-sm text-gray-500">
          <span>Abandono carrinho: <strong className="text-red-500">{kpis.addToCart > 0 ? (100 - Math.round(kpis.checkoutStarted / kpis.addToCart * 100)) : 0}%</strong></span>
          <span>Conversão global: <strong className="text-green-600">{kpis.conversionRate}%</strong></span>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sem dados de vendas no período</p>
        ) : (
          <div className="space-y-3">
            {topProducts.slice(0, 8).map((p, i) => (
              <div key={p.productId} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5 flex-shrink-0">{i + 1}</span>
                {p.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.product.images[0]} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.product?.name ?? p.productId}</p>
                  <p className="text-xs text-gray-400">{Number(p.product?.price ?? 0).toLocaleString()} AOA</p>
                </div>
                <span className="text-sm font-bold text-orange-600 flex-shrink-0">{p._sum.quantity ?? 0} un.</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple bar chart placeholder */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Produtos (unidades vendidas)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts.slice(0, 6).map(p => ({ name: p.product?.name?.slice(0, 15) ?? '?', qty: p._sum.quantity ?? 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qty" fill="#f97316" radius={[4, 4, 0, 0]} name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
