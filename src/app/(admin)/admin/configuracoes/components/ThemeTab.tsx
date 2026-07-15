'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Save, Loader2, CheckCircle, AlertCircle, Sun, Moon, SunMoon } from 'lucide-react'

interface Props {
  data: any
}

const MODES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'auto', label: 'Automático', icon: SunMoon },
]

export function ThemeTab({ data }: Props) {
  const [form, setForm] = useState({
    mode: data?.mode ?? 'light',
    primaryColor: data?.primaryColor ?? '#f97316',
    secondaryColor: data?.secondaryColor ?? '#1f2937',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSave() {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Tema guardado com sucesso.' })
    } catch {
      setToast({ type: 'error', message: 'Erro ao guardar tema.' })
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

      {/* Mode selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Modo de Exibição</h2>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => {
            const Icon = m.icon
            const active = form.mode === m.value
            return (
              <button
                key={m.value}
                onClick={() => setForm((f) => ({ ...f, mode: m.value }))}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${active ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Icon className={`w-6 h-6 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${active ? 'text-orange-700' : 'text-gray-600'}`}>{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Cores</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Cor Principal</Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 cursor-pointer">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="absolute inset-0 w-full h-full cursor-pointer border-none p-0 opacity-0"
                />
                <div className="w-full h-full" style={{ backgroundColor: form.primaryColor }} />
              </div>
              <div>
                <p className="text-sm font-mono font-medium text-gray-900">{form.primaryColor}</p>
                <p className="text-xs text-gray-400">Botões, links, destaques</p>
              </div>
            </div>
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              className="mt-2 w-full h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
            />
          </div>
          <div>
            <Label>Cor Secundária</Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 cursor-pointer">
                <div className="w-full h-full" style={{ backgroundColor: form.secondaryColor }} />
              </div>
              <div>
                <p className="text-sm font-mono font-medium text-gray-900">{form.secondaryColor}</p>
                <p className="text-xs text-gray-400">Fundos, textos secundários</p>
              </div>
            </div>
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
              className="mt-2 w-full h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="border border-gray-200 rounded-xl p-4 mt-4">
          <p className="text-xs text-gray-400 mb-3">Pré-visualização</p>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
              Botão Principal
            </button>
            <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: form.secondaryColor }}>
              Botão Secundário
            </button>
            <span className="text-sm font-medium" style={{ color: form.primaryColor }}>Link de exemplo</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Tema
        </Button>
      </div>
    </div>
  )
}
