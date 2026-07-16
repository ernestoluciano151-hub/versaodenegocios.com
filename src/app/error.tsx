'use client'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { logError } from '@/lib/logger'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError(error, 'root-error-boundary')
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ocorreu um erro</h1>
        <p className="text-gray-500 mb-8">Algo correu mal. Por favor tente novamente.</p>
        {error.digest && <p className="mt-2 text-xs text-gray-400">Código: {error.digest}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Ir para a homepage
          </a>
        </div>
      </div>
    </div>
  )
}
