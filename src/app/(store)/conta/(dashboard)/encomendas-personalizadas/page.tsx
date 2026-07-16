'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ClipboardList, Plus, X, Send, Clock, CheckCircle, Truck, AlertCircle, Package,
  Upload, Image as ImageIcon, FileText, Trash2, ExternalLink, ChevronDown, ChevronUp,
  Loader2, RefreshCw,
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type CustomOrderStatus =
  | 'received' | 'analyzing' | 'negotiating' | 'approved' | 'rejected'
  | 'purchasing' | 'in_transit' | 'delivered' | 'cancelled'

type CustomOrderOrigin = 'china' | 'usa' | 'portugal' | 'brazil' | 'other'

interface Message {
  id: string
  author: string
  authorName?: string
  text: string
  attachments: string[]
  createdAt: string
}

interface CustomOrder {
  id: string
  reference: string
  status: CustomOrderStatus
  productName: string
  origin: CustomOrderOrigin
  productLink?: string
  quantity: number
  color?: string
  model?: string
  size?: string
  notes?: string
  images: string[]
  files: string[]
  budget?: number
  quotedPrice?: number
  quotedDeadline?: string
  quotedConditions?: string
  adminNotes?: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CustomOrderStatus, string> = {
  received: 'Recebida',
  analyzing: 'Em Análise',
  negotiating: 'Em Negociação',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  purchasing: 'Em Compra',
  in_transit: 'Em Trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
  rejected: 'Rejeitado',
}

const STATUS_COLOR: Record<CustomOrderStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  analyzing: 'bg-sky-100 text-sky-700',
  negotiating: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  purchasing: 'bg-orange-100 text-orange-700',
  in_transit: 'bg-amber-100 text-amber-700',
  delivered: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  rejected: 'bg-rose-100 text-rose-700',
}

const ORIGIN_LABELS: Record<CustomOrderOrigin, string> = {
  china: '🇨🇳 China',
  usa: '🇺🇸 Estados Unidos',
  portugal: '🇵🇹 Portugal',
  brazil: '🇧🇷 Brasil',
  other: '📦 Outro',
}

const STATUS_PROGRESS: CustomOrderStatus[] = [
  'received', 'analyzing', 'negotiating', 'approved', 'purchasing', 'in_transit', 'delivered',
]

const CLOSED_STATUSES: CustomOrderStatus[] = ['delivered', 'cancelled', 'rejected']

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CustomOrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function StatusIcon({ status }: { status: CustomOrderStatus }) {
  if (status === 'delivered') return <CheckCircle className="w-5 h-5 text-emerald-500" />
  if (['cancelled', 'rejected'].includes(status)) return <AlertCircle className="w-5 h-5 text-red-500" />
  if (status === 'in_transit') return <Truck className="w-5 h-5 text-emerald-500" />
  if (['purchasing', 'approved'].includes(status)) return <Package className="w-5 h-5 text-orange-500" />
  return <Clock className="w-5 h-5 text-blue-500" />
}

function ProgressTimeline({ status }: { status: CustomOrderStatus }) {
  const idx = STATUS_PROGRESS.indexOf(status)
  if (idx === -1) return null
  return (
    <div className="flex items-center gap-1 py-3 px-1 overflow-x-auto">
      {STATUS_PROGRESS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-shrink-0">
          <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${i <= idx ? 'bg-orange-500 border-orange-500' : 'bg-gray-100 border-gray-300'}`} />
          {i < STATUS_PROGRESS.length - 1 && (
            <div className={`h-0.5 w-5 ${i < idx ? 'bg-orange-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Upload component ──────────────────────────────────────────────────────────

function FileUploadArea({
  uploads,
  onAdd,
  onRemove,
  uploading,
}: {
  uploads: string[]
  onAdd: (url: string) => void
  onRemove: (url: string) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localUploading, setLocalUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handleFiles(files: FileList) {
    setUploadError('')
    if (uploads.length + files.length > 10) {
      setUploadError('Máximo 10 ficheiros permitidos.')
      return
    }
    setLocalUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/conta/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const data = await res.json()
          onAdd(data.url)
        } else {
          const err = await res.json()
          setUploadError(err.error || 'Erro no upload.')
        }
      } catch {
        setUploadError('Falha no upload. Tente novamente.')
      }
    }
    setLocalUploading(false)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/30'}`}
      >
        {localUploading || uploading ? (
          <Loader2 className="w-8 h-8 text-orange-500 mx-auto animate-spin mb-2" />
        ) : (
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        )}
        <p className="text-sm text-gray-600 font-medium">
          {localUploading ? 'A fazer upload…' : 'Arraste ficheiros aqui ou clique para seleccionar'}
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, PDF · máx 10 MB · até 10 ficheiros</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
        />
      </div>
      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
      {uploads.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {uploads.map((url) => {
            const isPdf = url.includes('.pdf') || url.includes('raw/upload')
            return (
              <div key={url} className="relative group">
                {isPdf ? (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── New Order Form ────────────────────────────────────────────────────────────

interface FormState {
  productName: string
  origin: CustomOrderOrigin
  productLink: string
  quantity: string
  color: string
  model: string
  size: string
  notes: string
  budget: string
  images: string[]
}

const EMPTY_FORM: FormState = {
  productName: '', origin: 'other', productLink: '', quantity: '1',
  color: '', model: '', size: '', notes: '', budget: '', images: [],
}

function NewOrderForm({ onSuccess, onCancel }: { onSuccess: (order: CustomOrder) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string | string[]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.productName.trim()) { setError('O nome do produto é obrigatório.'); return }
    if (!form.quantity || parseInt(form.quantity) < 1) { setError('A quantidade deve ser pelo menos 1.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/conta/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName.trim(),
          origin: form.origin,
          productLink: form.productLink || null,
          quantity: parseInt(form.quantity),
          color: form.color || null,
          model: form.model || null,
          size: form.size || null,
          notes: form.notes || null,
          budget: form.budget ? parseFloat(form.budget) : null,
          images: form.images,
        }),
      })
      if (res.ok) {
        const order = await res.json()
        onSuccess(order)
      } else {
        const err = await res.json()
        setError(err.error || 'Erro ao enviar encomenda.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-500" />
          Nova Encomenda Personalizada
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Row 1 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Nome do Produto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.productName}
              onChange={e => set('productName', e.target.value)}
              placeholder="ex: Camisola Nike Air Max"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Origem do Produto <span className="text-red-500">*</span>
            </label>
            <select
              value={form.origin}
              onChange={e => set('origin', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              {Object.entries(ORIGIN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Quantidade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Cor</label>
            <input
              type="text"
              value={form.color}
              onChange={e => set('color', e.target.value)}
              placeholder="ex: Preto, Azul"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Tamanho</label>
            <input
              type="text"
              value={form.size}
              onChange={e => set('size', e.target.value)}
              placeholder="ex: M, XL, 42"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Modelo / Referência</label>
            <input
              type="text"
              value={form.model}
              onChange={e => set('model', e.target.value)}
              placeholder="ex: AJ1 High OG"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Orçamento Estimado (Kz)
            </label>
            <input
              type="number"
              min="0"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
              placeholder="ex: 50000"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Product link */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            Link do Produto (opcional)
          </label>
          <input
            type="url"
            value={form.productLink}
            onChange={e => set('productLink', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            Observações Adicionais
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Prazo desejado, especificações especiais, materiais preferidos..."
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            Imagens / Referências (opcional)
          </label>
          <FileUploadArea
            uploads={form.images}
            onAdd={url => set('images', [...form.images, url])}
            onRemove={url => set('images', form.images.filter(u => u !== url))}
            uploading={uploading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'A enviar…' : 'Enviar Encomenda'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({ order, onUpdate }: { order: CustomOrder; onUpdate: (id: string, updated: CustomOrder) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (expanded) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [expanded, order.messages.length])

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/conta/custom-orders/${order.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText }),
      })
      if (res.ok) {
        const msg = await res.json()
        onUpdate(order.id, { ...order, messages: [...order.messages, msg] })
        setReplyText('')
      }
    } finally {
      setSending(false)
    }
  }

  const isClosed = CLOSED_STATUSES.includes(order.status)
  const hasQuote = order.quotedPrice != null

  return (
    <div className={`bg-white rounded-2xl border transition-all ${expanded ? 'border-orange-300 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <StatusIcon status={order.status} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{order.productName}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                <span className="font-mono">{order.reference}</span>
                <span>{ORIGIN_LABELS[order.origin]}</span>
                <span>Qtd: {order.quantity}</span>
                {order.color && <span>Cor: {order.color}</span>}
                {order.size && <span>Tam: {order.size}</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {order.budget && (
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                {formatCurrency(Number(order.budget))}
              </span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Progress timeline */}
          {!isClosed && (
            <div className="px-5 pt-3 pb-1">
              <p className="text-xs text-gray-500 font-medium mb-1">Progresso</p>
              <ProgressTimeline status={order.status} />
            </div>
          )}

          {/* Quote info */}
          {hasQuote && (
            <div className="mx-5 mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">Orçamento Recebido</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Valor</span>
                  <p className="font-bold text-green-700">{formatCurrency(Number(order.quotedPrice))}</p>
                </div>
                {order.quotedDeadline && (
                  <div>
                    <span className="text-gray-500 text-xs">Prazo</span>
                    <p className="font-semibold text-gray-800">{order.quotedDeadline}</p>
                  </div>
                )}
              </div>
              {order.quotedConditions && (
                <p className="text-xs text-gray-600 mt-2">{order.quotedConditions}</p>
              )}
            </div>
          )}

          {/* Details */}
          <div className="px-5 pb-3 grid sm:grid-cols-2 gap-3 text-sm">
            {order.model && <div><span className="text-xs text-gray-400">Modelo:</span> <span className="text-gray-800">{order.model}</span></div>}
            {order.budget && <div><span className="text-xs text-gray-400">Orçamento cliente:</span> <span className="text-gray-800">{formatCurrency(Number(order.budget))}</span></div>}
            {order.notes && (
              <div className="sm:col-span-2">
                <span className="text-xs text-gray-400">Notas:</span>
                <p className="text-gray-700 mt-0.5">{order.notes}</p>
              </div>
            )}
            {order.productLink && (
              <div className="sm:col-span-2">
                <a href={order.productLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-500 hover:underline text-xs">
                  <ExternalLink className="w-3 h-3" /> Ver produto original
                </a>
              </div>
            )}
          </div>

          {/* Images */}
          {order.images.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Imagens</p>
              <div className="flex gap-2 flex-wrap">
                {order.images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Message thread */}
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Mensagens {order.messages.length > 0 && `(${order.messages.length})`}
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {order.messages.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Sem mensagens ainda. Envie uma mensagem para o nosso equipa.</p>
              ) : (
                order.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.author === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-2xl text-sm ${
                      m.author === 'customer'
                        ? 'bg-orange-500 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      {m.author !== 'customer' && m.authorName && (
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">{m.authorName}</p>
                      )}
                      <p>{m.text}</p>
                      <p className={`text-xs mt-1 ${m.author === 'customer' ? 'text-orange-200' : 'text-gray-400'}`}>
                        {formatDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {!isClosed && (
              <form onSubmit={sendReply} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva uma mensagem…"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function EncomendasPersonalizadasPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/conta/custom-orders', { cache: 'no-store' })
      if (res.ok) setOrders(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => fetchOrders(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  function handleNewOrder(order: CustomOrder) {
    setOrders(prev => [order, ...prev])
    setShowForm(false)
  }

  function handleUpdate(id: string, updated: CustomOrder) {
    setOrders(prev => prev.map(o => o.id === id ? updated : o))
  }

  const inProgress = orders.filter(o => !CLOSED_STATUSES.includes(o.status))
  const closed = orders.filter(o => CLOSED_STATUSES.includes(o.status))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encomendas Personalizadas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Solicite produtos sob medida e acompanhe o estado em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Encomenda
            </button>
          )}
        </div>
      </div>

      {/* New order form */}
      {showForm && (
        <NewOrderForm
          onSuccess={handleNewOrder}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Stats */}
      {orders.length > 0 && !showForm && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: orders.length, color: 'text-gray-900' },
            { label: 'Em curso', value: inProgress.length, color: 'text-orange-600' },
            { label: 'Concluídas', value: orders.filter(o => o.status === 'delivered').length, color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Sem encomendas personalizadas</h3>
          <p className="text-sm text-gray-400 mb-5">
            Solicite produtos que não encontra na loja — importamos para si.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Fazer Primeira Encomenda
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* In progress */}
          {inProgress.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Em Andamento ({inProgress.length})</h2>
              {inProgress.map(order => (
                <OrderCard key={order.id} order={order} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
          {/* Closed */}
          {closed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Historial ({closed.length})</h2>
              {closed.map(order => (
                <OrderCard key={order.id} order={order} onUpdate={handleUpdate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
