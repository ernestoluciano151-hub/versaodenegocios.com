'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Send, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface Props {
  data: any
}

export function EmailTab({ data }: Props) {
  const [form, setForm] = useState({
    provider: data?.provider ?? 'resend',
    apiKey: data?.apiKey ?? '',
    fromEmail: data?.fromEmail ?? '',
    fromName: data?.fromName ?? '',
    supportEmail: data?.supportEmail ?? '',
    financeEmail: data?.financeEmail ?? '',
    salesEmail: data?.salesEmail ?? '',
  })
  const [testEmail, setTestEmail] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      showToast('success', 'Configurações de email guardadas.')
    } catch {
      showToast('error', 'Erro ao guardar configurações.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTest() {
    if (!testEmail) return showToast('error', 'Introduza um email de teste.')
    setTesting(true)
    try {
      const res = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', toEmail: testEmail }),
      })
      if (!res.ok) throw new Error()
      showToast('success', `Email de teste enviado para ${testEmail}.`)
    } catch {
      showToast('error', 'Erro ao enviar email de teste.')
    } finally {
      setTesting(false)
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

      {/* Provider config */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Configuração do Fornecedor</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Fornecedor</Label>
            <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              Resend
            </div>
          </div>
          <div>
            <Label>API Key</Label>
            <div className="mt-1 relative">
              <Input type={showKey ? 'text' : 'password'} value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} className="pr-10" placeholder="re_..." />
              <button type="button" onClick={() => setShowKey((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email Remetente</Label>
              <Input className="mt-1" type="email" value={form.fromEmail} onChange={(e) => set('fromEmail', e.target.value)} placeholder="noreply@..." />
            </div>
            <div>
              <Label>Nome Remetente</Label>
              <Input className="mt-1" value={form.fromName} onChange={(e) => set('fromName', e.target.value)} placeholder="VN Commerce" />
            </div>
          </div>
        </div>
      </div>

      {/* Department emails */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Emails por Departamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Suporte</Label>
            <Input className="mt-1" type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} placeholder="suporte@..." />
          </div>
          <div>
            <Label>Financeiro</Label>
            <Input className="mt-1" type="email" value={form.financeEmail} onChange={(e) => set('financeEmail', e.target.value)} placeholder="financeiro@..." />
          </div>
          <div>
            <Label>Vendas</Label>
            <Input className="mt-1" type="email" value={form.salesEmail} onChange={(e) => set('salesEmail', e.target.value)} placeholder="vendas@..." />
          </div>
        </div>
      </div>

      {/* Test email */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Testar Envio</h2>
        <div className="flex gap-3">
          <Input type="email" placeholder="email@teste.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
          <Button onClick={handleTest} disabled={testing} variant="outline" className="gap-2 whitespace-nowrap">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Testar Envio
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </Button>
      </div>
    </div>
  )
}
