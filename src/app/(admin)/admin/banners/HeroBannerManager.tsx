'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight, GripVertical, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  ctaLabel2: string | null
  ctaUrl2: string | null
  imageUrl: string | null
  bgColor: string
  textColor: string
  order: number
  active: boolean
}

const EMPTY: Omit<Banner, 'id' | 'active'> = {
  title: '', subtitle: '', ctaLabel: '', ctaUrl: '',
  ctaLabel2: '', ctaUrl2: '', imageUrl: '',
  bgColor: '#111827', textColor: '#ffffff', order: 0,
}

export function HeroBannerManager() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/hero-banners')
    setBanners(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(b: Banner) {
    setEditing(b)
    setForm({ title: b.title, subtitle: b.subtitle ?? '', ctaLabel: b.ctaLabel ?? '', ctaUrl: b.ctaUrl ?? '', ctaLabel2: b.ctaLabel2 ?? '', ctaUrl2: b.ctaUrl2 ?? '', imageUrl: b.imageUrl ?? '', bgColor: b.bgColor, textColor: b.textColor, order: b.order })
    setCreating(false)
  }

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm({ ...EMPTY, order: banners.length })
  }

  function cancel() { setEditing(null); setCreating(false) }

  async function save() {
    setSaving(true)
    if (editing) {
      await fetch(`/api/admin/hero-banners/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      showToast('Banner atualizado!')
    } else {
      await fetch('/api/admin/hero-banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, active: true }) })
      showToast('Banner criado!')
    }
    setSaving(false)
    cancel()
    load()
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/hero-banners/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !b.active }) })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Eliminar este banner?')) return
    await fetch(`/api/admin/hero-banners/${id}`, { method: 'DELETE' })
    showToast('Banner eliminado.')
    load()
  }

  const field = (key: keyof typeof form, label: string, placeholder = '') => (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1" value={form[key] as string} placeholder={placeholder} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div className="space-y-4">
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>}

      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
        <Button onClick={startCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-1" /> Novo Banner
        </Button>
      </div>

      {/* Form */}
      {(creating || editing) && (
        <div className="bg-white rounded-xl border border-orange-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{editing ? 'Editar Banner' : 'Novo Banner'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('title', 'Título *', 'Tecnologia de ponta ao seu alcance')}
            {field('subtitle', 'Subtítulo', 'Produtos importados directamente...')}
            {field('ctaLabel', 'Botão 1 — Texto', 'Ver Produtos')}
            {field('ctaUrl', 'Botão 1 — URL', '/produtos')}
            {field('ctaLabel2', 'Botão 2 — Texto', 'Ver Promoções')}
            {field('ctaUrl2', 'Botão 2 — URL', '/produtos?destaque=true')}
            {field('imageUrl', 'URL da Imagem de Fundo (opcional)', 'https://...')}
            <div>
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} className="w-10 h-9 rounded border border-gray-300 cursor-pointer" />
                <Input value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Cor do Texto</Label>
              <div className="flex gap-2 mt-1">
                <input type="color" value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="w-10 h-9 rounded border border-gray-300 cursor-pointer" />
                <Input value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Ordem</Label>
              <Input className="mt-1" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
            </div>
          </div>

          {/* Preview */}
          {form.title && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <div className="p-6 relative" style={{ backgroundColor: form.bgColor, backgroundImage: form.imageUrl ? `url(${form.imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {form.imageUrl && <div className="absolute inset-0 bg-black/40" />}
                <div className="relative">
                  <h2 className="text-xl font-bold" style={{ color: form.textColor }}>{form.title}</h2>
                  {form.subtitle && <p className="text-sm mt-1 opacity-80" style={{ color: form.textColor }}>{form.subtitle}</p>}
                  <div className="flex gap-2 mt-3">
                    {form.ctaLabel && <span className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg">{form.ctaLabel}</span>}
                    {form.ctaLabel2 && <span className="text-xs px-3 py-1.5 border border-white/50 text-white rounded-lg">{form.ctaLabel2}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.title} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
            <Button variant="outline" onClick={cancel}><X className="w-4 h-4 mr-1" />Cancelar</Button>
          </div>
        </div>
      )}

      {/* List */}
      {banners.length === 0 && !creating ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Nenhum banner criado ainda.</p>
          <Button onClick={startCreate} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-1" /> Criar primeiro banner
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${b.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 border border-gray-100"
                style={{ backgroundColor: b.bgColor, backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{b.title}</p>
                {b.subtitle && <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>}
              </div>
              <span className="text-xs text-gray-400">#{b.order}</span>
              <button onClick={() => toggleActive(b)} title={b.active ? 'Desativar' : 'Ativar'}>
                {b.active
                  ? <ToggleRight className="w-6 h-6 text-orange-500" />
                  : <ToggleLeft className="w-6 h-6 text-gray-300" />}
              </button>
              <Button variant="outline" size="sm" onClick={() => startEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="outline" size="sm" onClick={() => remove(b.id)} className="text-red-500 hover:border-red-300"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
