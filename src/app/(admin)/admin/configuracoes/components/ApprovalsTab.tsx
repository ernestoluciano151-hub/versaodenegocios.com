'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, X, Loader2, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react'

function formatDate(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  approvalRequests: any[]
}

export function ApprovalsTab({ approvalRequests: initial }: Props) {
  const [requests, setRequests] = useState(initial)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleAction(id: string, status: 'approved' | 'rejected') {
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      const res = await fetch(`/api/admin/approval-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comment: comments[id] ?? '' }),
      })
      if (!res.ok) throw new Error()
      setRequests((r) => r.filter((x) => x.id !== id))
      showToast('success', status === 'approved' ? 'Solicitação aprovada.' : 'Solicitação recusada.')
    } catch {
      showToast('error', 'Erro ao processar solicitação.')
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-gray-900">Aprovações Pendentes</h2>
          {requests.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
              {requests.length}
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Nenhuma aprovação pendente.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requests.map((req) => (
              <div key={req.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{req.type}</span>
                    </div>
                    {req.targetLabel && (
                      <p className="font-medium text-gray-900">{req.targetLabel}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Solicitado por <strong>{req.requestedByName ?? req.requestedBy}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Comentário (opcional)</label>
                  <Textarea
                    rows={2}
                    placeholder="Adicionar um comentário..."
                    value={comments[req.id] ?? ''}
                    onChange={(e) => setComments((c) => ({ ...c, [req.id]: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                    onClick={() => handleAction(req.id, 'approved')}
                    disabled={loading[req.id]}
                  >
                    {loading[req.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                    onClick={() => handleAction(req.id, 'rejected')}
                    disabled={loading[req.id]}
                  >
                    {loading[req.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Recusar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
