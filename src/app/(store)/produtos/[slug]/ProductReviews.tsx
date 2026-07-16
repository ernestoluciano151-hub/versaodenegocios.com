'use client'
import { useState, useEffect } from 'react'
import { Star, Send, Loader2 } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: string
  guestName: string | null
  customer: { name: string } | null
}

function Stars({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange?.(s)}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              s <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function ProductReviews({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [guestName, setGuestName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/produtos/${slug}/reviews`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews); setAverage(d.average); setTotal(d.total) })
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Selecione uma classificação.'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/produtos/${slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, title, body, guestName }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setSuccess(data.message)
    setShowForm(false)
    setRating(0); setTitle(''); setBody(''); setGuestName('')
    setSubmitting(false)
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Avaliações</h2>
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(average)} />
              <span className="text-sm text-gray-500">{average.toFixed(1)} · {total} avaliação{total !== 1 ? 'ões' : ''}</span>
            </div>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-orange-500 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            Escrever avaliação
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm mb-6">{success}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8 space-y-4">
          <h3 className="font-semibold text-gray-900">A sua avaliação</h3>
          <div>
            <p className="text-sm text-gray-600 mb-2">Classificação *</p>
            <Stars rating={rating} interactive onChange={setRating} />
          </div>
          <div>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nome (opcional)"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
            />
          </div>
          <div>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Título (opcional)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Partilhe a sua experiência com este produto... *"
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p>Ainda não há avaliações. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Stars rating={r.rating} />
                  {r.title && <p className="font-medium text-gray-900 mt-1">{r.title}</p>}
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  <p>{r.customer?.name ?? r.guestName ?? 'Anónimo'}</p>
                  <p>{new Date(r.createdAt).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
