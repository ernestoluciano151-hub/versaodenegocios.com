'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const INTEGRATIONS = [
  { key: 'googleAnalytics', label: 'Google Analytics (GA4)', idKey: 'googleAnalyticsId', enabledKey: 'googleAnalyticsEnabled', placeholder: 'G-XXXXXXXXXX', color: 'bg-orange-500' },
  { key: 'googleTagManager', label: 'Google Tag Manager', idKey: 'googleTagManagerId', enabledKey: 'googleTagManagerEnabled', placeholder: 'GTM-XXXXXXX', color: 'bg-blue-500' },
  { key: 'metaPixel', label: 'Meta Pixel (Facebook)', idKey: 'metaPixelId', enabledKey: 'metaPixelEnabled', placeholder: '000000000000000', color: 'bg-blue-700' },
  { key: 'tiktokPixel', label: 'TikTok Pixel', idKey: 'tiktokPixelId', enabledKey: 'tiktokPixelEnabled', placeholder: 'XXXXXXXXXXXXXXXXXX', color: 'bg-gray-900' },
  { key: 'linkedinInsight', label: 'LinkedIn Insight Tag', idKey: 'linkedinInsightId', enabledKey: 'linkedinInsightEnabled', placeholder: '0000000', color: 'bg-blue-600' },
  { key: 'hotjar', label: 'Hotjar', idKey: 'hotjarId', enabledKey: 'hotjarEnabled', placeholder: '0000000', color: 'bg-red-500' },
  { key: 'microsoftClarity', label: 'Microsoft Clarity', idKey: 'microsoftClarityId', enabledKey: 'microsoftClarityEnabled', placeholder: 'xxxxxxxxxx', color: 'bg-purple-600' },
]

interface Props {
  data: any
}

export function AnalyticsTab({ data }: Props) {
  const [form, setForm] = useState({
    googleAnalyticsId: data?.googleAnalyticsId ?? '',
    googleAnalyticsEnabled: data?.googleAnalyticsEnabled ?? false,
    googleTagManagerId: data?.googleTagManagerId ?? '',
    googleTagManagerEnabled: data?.googleTagManagerEnabled ?? false,
    metaPixelId: data?.metaPixelId ?? '',
    metaPixelEnabled: data?.metaPixelEnabled ?? false,
    tiktokPixelId: data?.tiktokPixelId ?? '',
    tiktokPixelEnabled: data?.tiktokPixelEnabled ?? false,
    linkedinInsightId: data?.linkedinInsightId ?? '',
    linkedinInsightEnabled: data?.linkedinInsightEnabled ?? false,
    hotjarId: data?.hotjarId ?? '',
    hotjarEnabled: data?.hotjarEnabled ?? false,
    microsoftClarityId: data?.microsoftClarityId ?? '',
    microsoftClarityEnabled: data?.microsoftClarityEnabled ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function setField(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/settings/analytics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Analytics guardado com sucesso.' })
    } catch {
      setToast({ type: 'error', message: 'Erro ao guardar analytics.' })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {INTEGRATIONS.map((integration) => {
          const idVal = (form as any)[integration.idKey] as string
          const enabled = (form as any)[integration.enabledKey] as boolean
          return (
            <div key={integration.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {integration.label.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 text-sm">{integration.label}</h3>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(c) => setField(integration.enabledKey, c)}
                    />
                  </div>
                  <Input
                    placeholder={integration.placeholder}
                    value={idVal}
                    onChange={(e) => setField(integration.idKey, e.target.value)}
                    disabled={!enabled}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Analytics
        </Button>
      </div>
    </div>
  )
}
