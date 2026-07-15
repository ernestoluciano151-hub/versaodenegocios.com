'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const NETWORKS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/vncommerce', color: '#1877F2' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/vncommerce', color: '#E4405F' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/vncommerce', color: '#0A66C2' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@vncommerce', color: '#000000' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@vncommerce', color: '#FF0000' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/vncommerce', color: '#000000' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/244900000000', color: '#25D366' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/vncommerce', color: '#2CA5E0' },
]

interface Props {
  data: any
}

export function SocialTab({ data }: Props) {
  const [form, setForm] = useState({
    facebook: data?.facebook ?? '',
    instagram: data?.instagram ?? '',
    linkedin: data?.linkedin ?? '',
    tiktok: data?.tiktok ?? '',
    youtube: data?.youtube ?? '',
    twitter: data?.twitter ?? '',
    whatsapp: data?.whatsapp ?? '',
    telegram: data?.telegram ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSave() {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/settings/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Redes sociais guardadas.' })
    } catch {
      setToast({ type: 'error', message: 'Erro ao guardar.' })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Redes Sociais</h2>
        <div className="space-y-4">
          {NETWORKS.map((net) => (
            <div key={net.key} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: net.color }}
              >
                {net.label.slice(0, 2)}
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-500">{net.label}</Label>
                <Input
                  className="mt-0.5"
                  value={(form as any)[net.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [net.key]: e.target.value }))}
                  placeholder={net.placeholder}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Redes Sociais
        </Button>
      </div>
    </div>
  )
}
