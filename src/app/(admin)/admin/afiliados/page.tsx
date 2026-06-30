import type { Metadata } from 'next'
import { UserCheck } from 'lucide-react'
import { AffiliatesManager } from './AffiliatesManager'

export const metadata: Metadata = { title: 'Afiliados' }

export default function AfiliadosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Programa de Afiliados</h1>
          <p className="text-sm text-gray-500">Gestão de afiliados, comissões e pagamentos</p>
        </div>
      </div>
      <AffiliatesManager />
    </div>
  )
}
