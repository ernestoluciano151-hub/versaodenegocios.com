'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { formatCurrency } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  salePrice?: number
  images: string[]
}

export function SearchModal() {
  const { searchOpen, closeSearch } = useUIStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`)
      const data = await res.json()
      setResults(data.products ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    if (!searchOpen) { setQuery(''); setResults([]) }
  }, [searchOpen])

  if (!searchOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSearch} />
      <div className="relative max-w-2xl mx-auto mt-16 mx-4 sm:mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Pesquisar produtos, marcas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 text-gray-900 placeholder:text-gray-400 focus:outline-none text-base"
            />
            {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
            <button onClick={closeSearch} className="p-1 rounded hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {results.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/produtos/${product.slug}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 relative bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <Image
                        src={product.images[0] ?? '/placeholder-product.jpg'}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{product.brand}</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm font-bold text-orange-500">
                        {formatCurrency(product.salePrice ?? product.price)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500">
              Nenhum produto encontrado para "{query}"
            </div>
          )}

          {results.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <Link
                href={`/produtos?search=${encodeURIComponent(query)}`}
                onClick={closeSearch}
                className="block text-center text-sm text-orange-500 hover:underline"
              >
                Ver todos os resultados para "{query}"
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
