import type { Metadata } from 'next'
import { BarChart3 } from 'lucide-react'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { LeadsAndFraudManager } from './LeadsAndFraudManager'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Desempenho, conversão e comportamento dos clientes</p>
        </div>
      </div>
      <AnalyticsDashboard />
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads, Fraude e Visualizações</h2>
        <LeadsAndFraudManager />
      </div>
    </div>
  )
}
