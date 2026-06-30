'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-4">
      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Erro no painel</h2>
      <p className="text-sm text-gray-500 mb-6">Ocorreu um erro inesperado.</p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
      >
        <RefreshCw className="w-4 h-4" /> Tentar novamente
      </button>
    </div>
  )
}
