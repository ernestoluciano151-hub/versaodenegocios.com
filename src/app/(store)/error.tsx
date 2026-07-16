'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home } from 'lucide-react'
import { logError } from '@/lib/logger'

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logError(error, 'store-error-boundary')
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-4">😔</p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Algo correu mal</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Não foi possível carregar esta página. Por favor tente novamente.
      </p>
      {error.digest && <p className="mt-2 text-xs text-gray-400">Código: {error.digest}</p>}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Início
        </Link>
      </div>
    </div>
  )
}
