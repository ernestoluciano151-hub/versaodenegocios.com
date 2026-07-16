'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logError } from '@/lib/logger'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { logError(error, 'dashboard-error-boundary') }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <AlertTriangle className="w-7 h-7 text-orange-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Não foi possível carregar esta página</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">
        Ocorreu um erro ao carregar os seus dados. Por favor tente novamente.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-6">Código de erro: {error.digest}</p>
      )}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
        >
          <Home className="w-4 h-4" />
          Início
        </a>
      </div>
    </div>
  )
}
