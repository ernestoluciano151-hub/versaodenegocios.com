'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings2, ChevronUp, ChevronDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
  maintenance: 'bg-orange-100 text-orange-700',
  coming_soon: 'bg-yellow-100 text-yellow-700',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  maintenance: 'Manutenção',
  coming_soon: 'Em Breve',
}

interface Props {
  paymentMethods: any[]
}

export function PaymentsTab({ paymentMethods: initial }: Props) {
  const [methods, setMethods] = useState(initial)
  const [selected, setSelected] = useState<any>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [configJson, setConfigJson] = useState('')
  const [mcxForm, setMcxForm] = useState({ merchantId: '', terminalId: '', apiKey: '', secret: '', environment: 'sandbox', acceptIframe: false })
  const [codForm, setCodForm] = useState({ regions: '', minValue: '', maxValue: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function openConfig(method: any) {
    setSelected(method)
    const cfg = method.configuration ?? {}
    if (method.type === 'multicaixa_express') {
      setMcxForm({ merchantId: cfg.merchantId ?? '', terminalId: cfg.terminalId ?? '', apiKey: cfg.apiKey ?? '', secret: cfg.secret ?? '', environment: cfg.environment ?? 'sandbox', acceptIframe: cfg.acceptIframe ?? false })
    } else if (method.type === 'cash_on_delivery') {
      setCodForm({ regions: cfg.regions ?? '', minValue: cfg.minValue ?? '', maxValue: cfg.maxValue ?? '' })
    } else {
      setConfigJson(JSON.stringify(cfg, null, 2))
    }
    setConfigOpen(true)
  }

  async function patchMethod(id: string, body: any) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMethods((m) => m.map((x) => (x.id === id ? { ...x, ...data } : x)))
      showToast('success', 'Guardado com sucesso.')
      return true
    } catch {
      showToast('error', 'Erro ao guardar.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig() {
    if (!selected) return
    let configuration: any
    if (selected.type === 'multicaixa_express') {
      configuration = mcxForm
    } else if (selected.type === 'cash_on_delivery') {
      configuration = codForm
    } else {
      try {
        configuration = JSON.parse(configJson)
      } catch {
        showToast('error', 'JSON inválido.')
        return
      }
    }
    const ok = await patchMethod(selected.id, { configuration })
    if (ok) setConfigOpen(false)
  }

  async function moveOrder(id: string, dir: 'up' | 'down') {
    const idx = methods.findIndex((m) => m.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === methods.length - 1) return
    const newMethods = [...methods]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[newMethods[idx], newMethods[swap]] = [newMethods[swap], newMethods[idx]]
    setMethods(newMethods)
    await patchMethod(id, { sortOrder: swap })
  }

  return (
    <div className="max-w-3xl space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Métodos de Pagamento</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {methods.map((m, idx) => (
            <div key={m.id} className="px-5 py-4 flex items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveOrder(m.id, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveOrder(m.id, 'down')} disabled={idx === methods.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                <p className="text-xs text-gray-400 font-mono">{m.type}</p>
              </div>
              <Select value={m.status} onValueChange={(v) => patchMethod(m.id, { status: v })}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Switch checked={m.showInStore} onCheckedChange={(c) => patchMethod(m.id, { showInStore: c })} />
                <span>Mostrar</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => openConfig(m)} className="gap-1.5 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Configurar
              </Button>
            </div>
          ))}
          {methods.length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">Nenhum método de pagamento configurado.</p>
          )}
        </div>
      </div>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            {selected?.type === 'multicaixa_express' ? (
              <>
                <div><Label>Merchant ID</Label><Input className="mt-1" value={mcxForm.merchantId} onChange={(e) => setMcxForm((f) => ({ ...f, merchantId: e.target.value }))} /></div>
                <div><Label>Terminal ID</Label><Input className="mt-1" value={mcxForm.terminalId} onChange={(e) => setMcxForm((f) => ({ ...f, terminalId: e.target.value }))} /></div>
                <div><Label>API Key</Label><Input className="mt-1" type="password" value={mcxForm.apiKey} onChange={(e) => setMcxForm((f) => ({ ...f, apiKey: e.target.value }))} /></div>
                <div><Label>Secret</Label><Input className="mt-1" type="password" value={mcxForm.secret} onChange={(e) => setMcxForm((f) => ({ ...f, secret: e.target.value }))} /></div>
                <div>
                  <Label>Ambiente</Label>
                  <Select value={mcxForm.environment} onValueChange={(v) => setMcxForm((f) => ({ ...f, environment: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="iframe" checked={mcxForm.acceptIframe} onCheckedChange={(c) => setMcxForm((f) => ({ ...f, acceptIframe: !!c }))} />
                  <Label htmlFor="iframe">Aceitar iFrame</Label>
                </div>
              </>
            ) : selected?.type === 'cash_on_delivery' ? (
              <>
                <div><Label>Regiões (separadas por vírgula)</Label><Textarea className="mt-1" rows={3} value={codForm.regions} onChange={(e) => setCodForm((f) => ({ ...f, regions: e.target.value }))} /></div>
                <div><Label>Valor Mínimo (AOA)</Label><Input className="mt-1" type="number" value={codForm.minValue} onChange={(e) => setCodForm((f) => ({ ...f, minValue: e.target.value }))} /></div>
                <div><Label>Valor Máximo (AOA)</Label><Input className="mt-1" type="number" value={codForm.maxValue} onChange={(e) => setCodForm((f) => ({ ...f, maxValue: e.target.value }))} /></div>
              </>
            ) : (
              <div>
                <Label>Configuração (JSON)</Label>
                <Textarea className="mt-1 font-mono text-xs" rows={10} value={configJson} onChange={(e) => setConfigJson(e.target.value)} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancelar</Button>
            <Button onClick={saveConfig} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
