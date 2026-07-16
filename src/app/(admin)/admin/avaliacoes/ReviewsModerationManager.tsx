'use client'
import { useState, useEffect, useCallback } from 'react'
import { Star, Check, Trash2, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Review {
  id: string
  rating: number
  title: string | null
  body: string
  approved: boolean
  createdAt: string
  guestName: string | null
  customer: { name: string; email: string } | null
  product: { name: string; slug: string }
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  )
}

export function ReviewsModerationManager() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const q = filter === 'pending' ? '?approved=false' : filter === 'approved' ? '?approved=true' : ''
    const res = await fetch(`/api/admin/reviews${q}`)
    setReviews(await res.json())
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function approve(id: string) {
    await fetch('/api/admin/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approved: true }) })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Eliminar esta avaliação?')) return
    await fetch('/api/admin/reviews', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {(['pending', 'approved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovadas' : 'Todas'}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="ml-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {loading ? 'A carregar...' : 'Nenhuma avaliação encontrada.'}
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('pt-PT')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.approved ? 'Aprovada' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    <span className="font-medium text-gray-600">{r.customer?.name ?? r.guestName ?? 'Anónimo'}</span>
                    {r.customer?.email && ` · ${r.customer.email}`}
                    {' · '}<a href={`/produtos/${r.product.slug}`} target="_blank" className="text-orange-500 hover:underline">{r.product.name}</a>
                  </p>
                  {r.title && <p className="font-medium text-gray-900 text-sm">{r.title}</p>}
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.body}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!r.approved && (
                    <Button size="sm" onClick={() => approve(r.id)} className="bg-green-500 hover:bg-green-600 text-white">
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => remove(r.id)} className="text-red-500 hover:border-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
