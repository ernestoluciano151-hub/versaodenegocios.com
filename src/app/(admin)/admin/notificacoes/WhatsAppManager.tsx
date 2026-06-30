'use client'
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Settings, Send, History, Zap, CheckCircle, XCircle, RefreshCw, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const PROVIDERS = [
  { value: 'evolution', label: 'Evolution API (self-hosted)' },
  { value: 'meta', label: 'Meta WhatsApp Cloud API' },
  { value: 'twilio', label: 'Twilio' },
  { value: 'ultramsg', label: 'UltraMsg' },
]

const EVENT_LABELS: Record<string, string> = {
  'customer.created': '👤 Conta Criada',
  'customer.password_recovery': '🔐 Recuperação de Password',
  'order.received': '🛍️ Pedido Recebido',
  'order.confirmed': '✅ Pedido Confirmado',
  'order.shipped': '🚚 Pedido Enviado',
  'order.delivered': '🎉 Pedido Entregue',
  'ticket.replied': '💬 Ticket Respondido',
  'promotion.generic': '🔥 Promoção',
  'admin.new_order': '🛒 Novo Pedido (Admin)',
  'admin.new_customer': '👤 Novo Cliente (Admin)',
  'admin.new_ticket': '🎫 Novo Ticket (Admin)',
  'admin.cart_abandoned': '🛒 Carrinho Abandonado (Admin)',
  'admin.low_stock': '⚠️ Stock Baixo (Admin)',
}

interface Config {
  id?: string
  provider?: string
  apiUrl?: string
  apiKey?: string
  instanceId?: string
  fromNumber?: string
  active?: boolean
  testMode?: boolean
}

interface Template {
  id: string
  event: string
  title: string
  body: string
  active: boolean
  target: string
}

interface Message {
  id: string
  phone: string
  body: string
  status: string
  provider: string
  sentAt: string | null
  createdAt: string
  customer?: { name: string; phone: string } | null
}

export function WhatsAppManager() {
  const [config, setConfig] = useState<Config>({})
  const [templates, setTemplates] = useState<Template[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendPhone, setSendPhone] = useState('')
  const [sendEvent, setSendEvent] = useState('')
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadConfig = useCallback(async () => {
    const res = await fetch('/api/admin/whatsapp/config')
    const data = await res.json()
    setConfig(data)
  }, [])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/whatsapp/templates')
    const data = await res.json()
    setTemplates(data)
  }, [])

  const loadMessages = useCallback(async () => {
    const res = await fetch('/api/admin/whatsapp/messages')
    const data = await res.json()
    setMessages(data.messages ?? [])
  }, [])

  useEffect(() => {
    loadConfig()
    loadTemplates()
    loadMessages()
  }, [loadConfig, loadTemplates, loadMessages])

  async function saveConfig() {
    setSaving(true)
    await fetch('/api/admin/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    showToast('Configuração guardada!')
  }

  async function seedTemplates() {
    setSeeding(true)
    await fetch('/api/admin/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: true }),
    })
    await loadTemplates()
    setSeeding(false)
    showToast('Templates criados!')
  }

  async function saveTemplate() {
    if (!editTemplate) return
    setSavingTemplate(true)
    await fetch('/api/admin/whatsapp/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTemplate),
    })
    await loadTemplates()
    setEditTemplate(null)
    setSavingTemplate(false)
    showToast('Template guardado!')
  }

  async function sendManual() {
    if (!sendPhone || !sendEvent) return
    setSending(true)
    const res = await fetch('/api/admin/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: sendPhone, event: sendEvent, vars: { customerName: 'Teste', orderId: '00001', orderTotal: '1000' } }),
    })
    const data = await res.json()
    setSending(false)
    await loadMessages()
    showToast(data.success ? '✅ Mensagem enviada!' : `❌ Erro: ${data.error}`)
  }

  const statusColor: Record<string, string> = {
    sent: 'bg-green-100 text-green-700',
    delivered: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    queued: 'bg-yellow-100 text-yellow-700',
    read: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">{toast}</div>
      )}

      <Tabs defaultValue="config">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config"><Settings className="w-4 h-4 mr-1" />Configuração</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="w-4 h-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="send"><Send className="w-4 h-4 mr-1" />Enviar</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-1" />Histórico</TabsTrigger>
        </TabsList>

        {/* CONFIG */}
        <TabsContent value="config" className="space-y-4 mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" /> Provider WhatsApp
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Activo</span>
                <Switch
                  checked={config.active ?? false}
                  onCheckedChange={(v) => setConfig(c => ({ ...c, active: v }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Select value={config.provider ?? ''} onValueChange={(v) => setConfig(c => ({ ...c, provider: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>API URL (Evolution/UltraMsg)</Label>
                <Input className="mt-1" value={config.apiUrl ?? ''} onChange={e => setConfig(c => ({ ...c, apiUrl: e.target.value }))} placeholder="https://evolution.meuserver.com" />
              </div>
              <div>
                <Label>API Key / Token</Label>
                <Input className="mt-1" type="password" value={config.apiKey ?? ''} onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))} placeholder="••••••••" />
              </div>
              <div>
                <Label>Instance ID / Phone Number ID</Label>
                <Input className="mt-1" value={config.instanceId ?? ''} onChange={e => setConfig(c => ({ ...c, instanceId: e.target.value }))} placeholder="minha-instancia" />
              </div>
              <div>
                <Label>Número de Origem</Label>
                <Input className="mt-1" value={config.fromNumber ?? ''} onChange={e => setConfig(c => ({ ...c, fromNumber: e.target.value }))} placeholder="+244911234567" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch
                  checked={config.testMode ?? true}
                  onCheckedChange={(v) => setConfig(c => ({ ...c, testMode: v }))}
                />
                <Label>Modo de teste (não envia mensagens reais)</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveConfig} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Configuração
              </Button>
            </div>

            {config.provider === 'evolution' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Evolution API:</strong> apiKey = API Key da instância · instanceId = nome da instância
              </div>
            )}
            {config.provider === 'twilio' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Twilio:</strong> API Key = &quot;AccountSID:AuthToken&quot; · Instance ID = número de origem (+1...)
              </div>
            )}
            {config.provider === 'meta' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Meta Cloud API:</strong> API Key = Access Token · Instance ID = Phone Number ID
              </div>
            )}
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{templates.length} template(s) configurado(s)</p>
            <Button variant="outline" size="sm" onClick={seedTemplates} disabled={seeding}>
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              Criar Templates Padrão
            </Button>
          </div>

          {editTemplate ? (
            <div className="bg-white rounded-xl border border-orange-200 p-6 space-y-4">
              <h3 className="font-semibold">Editar: {EVENT_LABELS[editTemplate.event] ?? editTemplate.event}</h3>
              <div>
                <Label>Título</Label>
                <Input className="mt-1" value={editTemplate.title} onChange={e => setEditTemplate(t => t ? ({ ...t, title: e.target.value }) : t)} />
              </div>
              <div>
                <Label>Mensagem <span className="text-gray-400 text-xs">(variáveis: {'{{customerName}}'}, {'{{orderId}}'}, {'{{orderTotal}}'}, {'{{resetLink}}'}, {'{{trackingCode}}'})</span></Label>
                <Textarea className="mt-1" rows={5} value={editTemplate.body} onChange={e => setEditTemplate(t => t ? ({ ...t, body: e.target.value }) : t)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editTemplate.active} onCheckedChange={(v) => setEditTemplate(t => t ? ({ ...t, active: v }) : t)} />
                <Label>Activo</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveTemplate} disabled={savingTemplate} className="bg-orange-500 hover:bg-orange-600">
                  {savingTemplate ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setEditTemplate(null)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{EVENT_LABELS[t.event] ?? t.event}</span>
                      <Badge className={t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                        {t.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{t.target}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{t.body}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditTemplate(t)}>Editar</Button>
                </div>
              ))}
              {templates.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhum template criado. Clique em &quot;Criar Templates Padrão&quot;.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* SEND */}
        <TabsContent value="send" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-lg">
            <h3 className="font-semibold text-gray-900">Enviar Mensagem Manual</h3>
            <div>
              <Label>Número de Telefone</Label>
              <Input className="mt-1" value={sendPhone} onChange={e => setSendPhone(e.target.value)} placeholder="+244911234567" />
            </div>
            <div>
              <Label>Template / Evento</Label>
              <Select value={sendEvent} onValueChange={setSendEvent}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={sendManual} disabled={sending || !sendPhone || !sendEvent} className="bg-orange-500 hover:bg-orange-600 w-full">
              {sending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar Mensagem
            </Button>
          </div>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Histórico de Mensagens</h3>
              <Button variant="outline" size="sm" onClick={loadMessages}><RefreshCw className="w-4 h-4 mr-1" />Atualizar</Button>
            </div>
            <div className="divide-y divide-gray-50">
              {messages.map(m => (
                <div key={m.id} className="p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 pt-0.5">
                    {m.status === 'sent' || m.status === 'delivered' || m.status === 'read'
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{m.customer?.name ?? m.phone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[m.status] ?? 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                      <span className="text-xs text-gray-400">{m.provider}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{m.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString('pt-AO')}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma mensagem enviada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
