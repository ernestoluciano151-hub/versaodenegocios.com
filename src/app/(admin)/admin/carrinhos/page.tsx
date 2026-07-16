import { AbandonedCartsManager } from './AbandonedCartsManager'

export const metadata = { title: 'Carrinhos Abandonados | Admin' }

export default function AbandonedCartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Carrinhos Abandonados</h1>
        <p className="text-sm text-gray-500 mt-1">Carrinhos com itens não concluídos há mais de 1 hora.</p>
      </div>
      <AbandonedCartsManager />
    </div>
  )
}
