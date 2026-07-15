'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  data: any
}

export function SeoTab({ data }: Props) {
  const [form, setForm] = useState({
    siteTitle: data?.siteTitle ?? '',
    siteDescription: data?.siteDescription ?? '',
    keywords: data?.keywords ?? '',
    googleVerification: data?.googleVerification ?? '',
    facebookMeta: data?.facebookMeta ?? '',
    twitterMeta: data?.twitterMeta ?? '',
    robots: data?.robots ?? 'index, follow',
    ogImage: data?.ogImage ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/settings/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Configurações SEO guardadas.' })
    } catch {
      setToast({ type: 'error', message: 'Erro ao guardar.' })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Informações Básicas</h2>
        <div className="space-y-4">
          <div>
            <Label>Título do Site</Label>
            <Input className="mt-1" value={form.siteTitle} onChange={(e) => set('siteTitle', e.target.value)} placeholder="VN Commerce - Loja Online Angola" />
            <p className="text-xs text-gray-400 mt-1">{form.siteTitle.length}/60 caracteres recomendados</p>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea className="mt-1" rows={3} value={form.siteDescription} onChange={(e) => set('siteDescription', e.target.value)} placeholder="Descrição do site para mecanismos de pesquisa..." />
            <p className="text-xs text-gray-400 mt-1">{form.siteDescription.length}/160 caracteres recomendados</p>
          </div>
          <div>
            <Label>Palavras-chave</Label>
            <Input className="mt-1" value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="loja online, angola, compras, electrónica" />
            <p className="text-xs text-gray-400 mt-1">Separadas por vírgulas</p>
          </div>
          <div>
            <Label>Imagem Open Graph (URL)</Label>
            <Input className="mt-1" value={form.ogImage} onChange={(e) => set('ogImage', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Robots</Label>
            <Select value={form.robots} onValueChange={(v) => set('robots', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">index, follow</SelectItem>
                <SelectItem value="noindex, nofollow">noindex, nofollow</SelectItem>
                <SelectItem value="index, nofollow">index, nofollow</SelectItem>
                <SelectItem value="noindex, follow">noindex, follow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Verificações & Meta Tags</h2>
        <div className="space-y-4">
          <div>
            <Label>Google Verification</Label>
            <Input className="mt-1" value={form.googleVerification} onChange={(e) => set('googleVerification', e.target.value)} placeholder="google-site-verification=..." />
          </div>
          <div>
            <Label>Facebook Domain Verification</Label>
            <Input className="mt-1" value={form.facebookMeta} onChange={(e) => set('facebookMeta', e.target.value)} placeholder="facebook-domain-verification=..." />
          </div>
          <div>
            <Label>Twitter / X Card Meta</Label>
            <Input className="mt-1" value={form.twitterMeta} onChange={(e) => set('twitterMeta', e.target.value)} placeholder="summary_large_image" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar SEO
        </Button>
      </div>
    </div>
  )
}
