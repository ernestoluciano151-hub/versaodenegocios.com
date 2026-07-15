'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { StickyNote, Plus, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Note {
  id: string
  content: string
  authorName?: string
  createdAt: string
}

export function CustomerNotes({ customerId }: { customerId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/notes`)
      if (res.ok) setNotes(await res.json())
    } catch { /* noop */ }
    finally { setLoading(false) }
  }, [customerId])

  useEffect(() => { load() }, [load])

  async function addNote() {
    if (!content.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        const note = await res.json()
        setNotes(prev => [note, ...prev])
        setContent('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-gray-400" />
        <h2 className="font-semibold text-gray-900">Notas Internas</h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Add note */}
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Adicionar nota interna..."
            rows={2}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
          <Button
            size="sm"
            onClick={addNote}
            disabled={saving || !content.trim()}
            className="self-end bg-orange-500 hover:bg-orange-600 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {/* Notes list */}
        {loading ? (
          <div className="text-center py-4 text-gray-400 text-sm">A carregar...</div>
        ) : notes.length === 0 ? (
          <p className="text-center py-4 text-gray-400 text-sm">Sem notas internas.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notes.map(n => (
              <div key={n.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                <p className="text-sm text-gray-800">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.authorName && `${n.authorName} · `}{formatDate(n.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
