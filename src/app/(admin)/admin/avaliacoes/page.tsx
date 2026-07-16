import { ReviewsModerationManager } from './ReviewsModerationManager'

export const metadata = { title: 'Moderação de Avaliações | Admin' }

export default function AvaliacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avaliações de Produtos</h1>
        <p className="text-sm text-gray-500 mt-1">Aprovar ou rejeitar avaliações submetidas pelos clientes.</p>
      </div>
      <ReviewsModerationManager />
    </div>
  )
}
