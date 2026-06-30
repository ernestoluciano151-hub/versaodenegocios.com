'use client'
import { useState, useEffect, useCallback } from 'react'
import { Users, TrendingUp, Save, RefreshCw, Gift, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface LoyaltyStats {
  config: {
    id: string
    pointsPerKwanza: number
    kwanzaPerPoint: number
    signupBonus: number
    referralBonus: number
    silverThreshold: number
    goldThreshold: number
    platinumThreshold: number
    bronzeDiscount: number
    silverDiscount: number
    goldDiscount: number
    platinumDiscount: number
    active: boolean
  }
  totalAccounts: number
  totalPoints: number
  tierBreakdown: Array<{ tier: string; _count: { _all: number } }>
}

export function LoyaltyManager() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [saving, setSaving] = useState(false)
  const [awardCustomerId, setAwardCustomerId] = useState('')
  const [awardPoints, setAwardPoints] = useState('')
  const [awardDesc, setAwardDesc] = useState('')
  const [awarding, setAwarding] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/loyalty')
    const data = await res.json()
    setStats(data)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveConfig() {
    if (!stats) return
    setSaving(true)
    await fetch('/api/admin/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats.config),
    })
    setSaving(false)
    showToast('Configuração guardada!')
  }

  async function awardManual() {
    if (!awardCustomerId || !awardPoints) return
    setAwarding(true)
    await fetch('/api/admin/loyalty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'award', customerId: awardCustomerId, points: Number(awardPoints), description: awardDesc || 'Atribuição manual' }),
    })
    setAwarding(false)
    setAwardCustomerId('')
    setAwardPoints('')
    setAwardDesc('')
    showToast('Pontos atribuídos!')
    load()
  }

  if (!stats) return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}</div>

  const { config, totalAccounts, totalPoints, tierBreakdown } = stats

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total de Membros</p>
          <p className="text-2xl font-bold text-gray-900">{totalAccounts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Pontos em Circulação</p>
          <p className="text-2xl font-bold text-orange-500">{totalPoints.toLocaleString()}</p>
        </div>
        {[
          { tier: 'bronze', label: '🥉 Bronze', color: 'text-amber-600' },
          { tier: 'silver', label: '🥈 Prata', color: 'text-gray-600' },
          { tier: 'gold', label: '🥇 Ouro', color: 'text-yellow-600' },
          { tier: 'platinum', label: '💎 Platinum', color: 'text-purple-600' },
        ].slice(0, 2).map(t => {
          const count = tierBreakdown.find(b => b.tier === t.tier)?._count._all ?? 0
          return (
            <div key={t.tier} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{t.label}</p>
              <p className={`text-2xl font-bold ${t.color}`}>{count}</p>
            </div>
          )
        })}
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config"><TrendingUp className="w-4 h-4 mr-1" />Configuração</TabsTrigger>
          <TabsTrigger value="tiers"><Star className="w-4 h-4 mr-1" />Níveis</TabsTrigger>
          <TabsTrigger value="award"><Gift className="w-4 h-4 mr-1" />Atribuir Pontos</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Regras de Pontos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Pontos por Kwanza gasto</Label>
                <Input className="mt-1" type="number" step="0.01" value={config.pointsPerKwanza} onChange={e => setStats(s => s ? ({ ...s, config: { ...s.config, pointsPerKwanza: Number(e.target.value) } }) : s)} />
              </div>
              <div>
                <Label>Kwanzas por Ponto resgatado</Label>
                <Input className="mt-1" type="number" step="0.01" value={config.kwanzaPerPoint} onChange={e => setStats(s => s ? ({ ...s, config: { ...s.config, kwanzaPerPoint: Number(e.target.value) } }) : s)} />
              </div>
              <div>
                <Label>Bónus de Registo (pontos)</Label>
                <Input className="mt-1" type="number" value={config.signupBonus} onChange={e => setStats(s => s ? ({ ...s, config: { ...s.config, signupBonus: Number(e.target.value) } }) : s)} />
              </div>
              <div>
                <Label>Bónus de Indicação (pontos)</Label>
                <Input className="mt-1" type="number" value={config.referralBonus} onChange={e => setStats(s => s ? ({ ...s, config: { ...s.config, referralBonus: Number(e.target.value) } }) : s)} />
              </div>
            </div>
            <Button onClick={saveConfig} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="tiers" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Limiares e Descontos por Nível</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 text-gray-500 font-medium">Nível</th>
                    <th className="pb-3 text-gray-500 font-medium">Pontos Mínimos</th>
                    <th className="pb-3 text-gray-500 font-medium">Desconto Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { key: 'bronze', label: '🥉 Bronze', threshKey: null, discKey: 'bronzeDiscount' as keyof typeof config },
                    { key: 'silver', label: '🥈 Prata', threshKey: 'silverThreshold' as keyof typeof config, discKey: 'silverDiscount' as keyof typeof config },
                    { key: 'gold', label: '🥇 Ouro', threshKey: 'goldThreshold' as keyof typeof config, discKey: 'goldDiscount' as keyof typeof config },
                    { key: 'platinum', label: '💎 Platinum', threshKey: 'platinumThreshold' as keyof typeof config, discKey: 'platinumDiscount' as keyof typeof config },
                  ].map(t => (
                    <tr key={t.key} className="py-2">
                      <td className="py-3 font-medium">{t.label}</td>
                      <td className="py-3">
                        {t.threshKey ? (
                          <Input type="number" value={config[t.threshKey] as number} onChange={e => setStats(s => s ? ({ ...s, config: { ...s.config, [t.threshKey!]: Number(e.target.value) } }) : s)} className="w-32" />
                        ) : <span className="text-gray-400">0 (inicial)</span>}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Input type="number" step="0.5" value={config[t.discKey] as number} onChange={e => setStats(s => s ? ({ ...s, config: { ...s.config, [t.discKey]: Number(e.target.value) } }) : s)} className="w-24" />
                          <span className="text-gray-500">%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={saveConfig} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Níveis
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="award" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-lg">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users className="w-4 h-4" />Atribuir Pontos Manualmente</h3>
            <div>
              <Label>ID do Cliente</Label>
              <Input className="mt-1" value={awardCustomerId} onChange={e => setAwardCustomerId(e.target.value)} placeholder="cuid do cliente..." />
            </div>
            <div>
              <Label>Pontos a Atribuir</Label>
              <Input className="mt-1" type="number" value={awardPoints} onChange={e => setAwardPoints(e.target.value)} placeholder="100" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input className="mt-1" value={awardDesc} onChange={e => setAwardDesc(e.target.value)} placeholder="Campanha especial..." />
            </div>
            <Button onClick={awardManual} disabled={awarding} className="bg-orange-500 hover:bg-orange-600 w-full">
              {awarding ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />}
              Atribuir Pontos
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
