import type { Metadata } from 'next'
import { MessageSquare } from 'lucide-react'
import { WhatsAppManager } from './WhatsAppManager'

export const metadata: Metadata = { title: 'Notificações WhatsApp' }

export default function NotificacoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notificações WhatsApp</h1>
          <p className="text-sm text-gray-500">Configuração, templates e histórico de mensagens</p>
        </div>
      </div>
      <WhatsAppManager />
    </div>
  )
}
