import type { Metadata } from 'next'
import { Star } from 'lucide-react'
import { LoyaltyManager } from './LoyaltyManager'

export const metadata: Metadata = { title: 'Programa de Fidelização' }

export default function FidelizacaoAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programa de Fidelização</h1>
          <p className="text-sm text-gray-500">Pontos, níveis e benefícios dos clientes</p>
        </div>
      </div>
      <LoyaltyManager />
    </div>
  )
}
