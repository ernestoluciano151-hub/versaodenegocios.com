'use client'
import { useEffect, useState } from 'react'
import { Star, Gift, TrendingUp, Award, Clock, ChevronRight } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  points: number
  description: string
  createdAt: string
}

interface LoyaltyData {
  account: {
    points: number
    pointsUsed: number
    tier: string
  }
  transactions: Transaction[]
  config: {
    pointsPerKwanza: number
    kwanzaPerPoint: number
    silverThreshold: number
    goldThreshold: number
    platinumThreshold: number
    bronzeDiscount: number
    silverDiscount: number
    goldDiscount: number
    platinumDiscount: number
  }
  tierLabel: string
  tierColor: string
  nextTier: { name: string; pointsNeeded: number } | null
}

const TIER_BENEFITS: Record<string, string[]> = {
  bronze: ['1 ponto por cada kwanza gasto', 'Acesso a promoções exclusivas'],
  silver: ['1 ponto por cada kwanza + 5% desconto extra', 'Envio prioritário', 'Acesso antecipado a novidades'],
  gold: ['1 ponto + 10% desconto extra', 'Envio gratuito em pedidos +5000 AOA', 'Suporte prioritário', 'Acesso VIP a liquidações'],
  platinum: ['1 ponto + 15% desconto extra', 'Envio sempre gratuito', 'Gestor de conta pessoal', 'Ofertas exclusivas platinum'],
}

export default function FidelizacaoPage() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/conta/loyalty')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const { account, transactions, config, tierLabel, tierColor, nextTier } = data
  const tier = account.tier
  const nextThreshold = tier === 'bronze' ? config.silverThreshold
    : tier === 'silver' ? config.goldThreshold
    : tier === 'gold' ? config.platinumThreshold
    : account.points
  const prevThreshold = tier === 'silver' ? config.silverThreshold
    : tier === 'gold' ? config.goldThreshold
    : tier === 'platinum' ? config.platinumThreshold
    : 0
  const progress = tier === 'platinum' ? 100
    : Math.min(100, Math.round(((account.points - prevThreshold) / (nextThreshold - prevThreshold)) * 100))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Programa de Fidelização</h1>

      {/* Points card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">Pontos disponíveis</p>
            <p className="text-4xl font-bold">{account.points.toLocaleString()}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${tierColor}`}>
            {tierLabel}
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-orange-100">Utilizados</p>
            <p className="font-semibold">{account.pointsUsed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-orange-100">Equivalente</p>
            <p className="font-semibold">{Math.floor(account.points * Number(config.kwanzaPerPoint)).toLocaleString()} AOA</p>
          </div>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Progresso para {nextTier.name}</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
            <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">Faltam <strong>{nextTier.pointsNeeded.toLocaleString()} pontos</strong> para atingir o nível {nextTier.name}</p>
        </div>
      )}

      {/* Current tier benefits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-orange-500" /> Benefícios do seu nível
        </h3>
        <ul className="space-y-2">
          {(TIER_BENEFITS[tier] ?? []).map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Tiers overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'bronze', label: '🥉 Bronze', threshold: 0, discount: config.bronzeDiscount },
          { key: 'silver', label: '🥈 Prata', threshold: config.silverThreshold, discount: config.silverDiscount },
          { key: 'gold', label: '🥇 Ouro', threshold: config.goldThreshold, discount: config.goldDiscount },
          { key: 'platinum', label: '💎 Platinum', threshold: config.platinumThreshold, discount: config.platinumDiscount },
        ].map(t => (
          <div key={t.key} className={`rounded-xl border-2 p-3 text-center ${tier === t.key ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
            <p className="text-lg mb-1">{t.label.split(' ')[0]}</p>
            <p className="text-xs font-semibold text-gray-700">{t.label.split(' ')[1]}</p>
            <p className="text-xs text-gray-500 mt-1">{t.threshold === 0 ? 'Inicial' : `${t.threshold.toLocaleString()} pts`}</p>
            {Number(t.discount) > 0 && <p className="text-xs text-orange-600 font-medium mt-0.5">+{t.discount}% desc.</p>}
          </div>
        ))}
      </div>

      {/* How to earn */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" /> Como ganhar pontos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '🛍️', title: 'Compras', desc: `${config.pointsPerKwanza} ponto(s) por kwanza gasto` },
            { icon: '👤', title: 'Registo', desc: 'Bónus de boas-vindas na criação da conta' },
            { icon: '👥', title: 'Indicações', desc: 'Ganhe pontos por cada amigo que comprar' },
            { icon: '🎯', title: 'Campanhas', desc: 'Pontos extra em campanhas especiais' },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redeem */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-orange-500" /> Resgatar pontos
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Os seus <strong>{account.points.toLocaleString()} pontos</strong> equivalem a{' '}
          <strong>{Math.floor(account.points * Number(config.kwanzaPerPoint)).toLocaleString()} AOA</strong> em desconto.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { points: 100, value: Math.floor(100 * Number(config.kwanzaPerPoint)), label: '100 pts → Desconto' },
            { points: 500, value: Math.floor(500 * Number(config.kwanzaPerPoint)), label: '500 pts → Desconto' },
            { points: 1000, value: Math.floor(1000 * Number(config.kwanzaPerPoint)), label: '1000 pts → Desconto' },
          ].map(option => (
            <div key={option.points} className={`border rounded-xl p-3 text-center ${account.points >= option.points ? 'border-orange-200 bg-orange-50' : 'border-gray-100 opacity-50'}`}>
              <p className="text-lg font-bold text-orange-600">{option.value.toLocaleString()} AOA</p>
              <p className="text-xs text-gray-500">{option.points} pontos</p>
              <button
                disabled={account.points < option.points}
                className="mt-2 text-xs bg-orange-500 text-white px-3 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                Resgatar
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">* O resgate de pontos será aplicado como desconto no próximo pedido. Funcionalidade completa em breve.</p>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Histórico de Pontos</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-sm">Ainda não tem transações de pontos.</p>
          ) : (
            transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('pt-AO')}</p>
                </div>
                <span className={`text-sm font-bold ${t.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {t.points > 0 ? '+' : ''}{t.points}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
