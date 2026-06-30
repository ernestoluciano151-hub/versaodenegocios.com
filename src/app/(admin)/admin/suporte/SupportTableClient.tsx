'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ReplyForm } from './ReplyForm'

interface Ticket {
  id: string
  subject: string
  status: string
  createdAt: string
  customer: { name: string; email: string } | null
  adminReply: string | null
}

interface StatusConfig {
  label: string
  variant: 'default' | 'warning' | 'success' | 'secondary'
}

interface Props {
  tickets: Ticket[]
  statusConfig: Record<string, StatusConfig>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SupportTableClient({ tickets: initial, statusConfig }: Props) {
  const [tickets, setTickets] = useState(initial)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  const handleSuccess = () => {
    setActiveTicket(null)
    window.location.reload()
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Nenhum ticket de suporte encontrado.
      </div>
    )
  }

  return (
    <>
      {activeTicket && (
        <ReplyForm
          ticketId={activeTicket.id}
          ticketSubject={activeTicket.subject}
          currentStatus={activeTicket.status}
          onClose={() => setActiveTicket(null)}
          onSuccess={handleSuccess}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Assunto</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((ticket) => {
              const cfg = statusConfig[ticket.status] ?? { label: ticket.status, variant: 'secondary' as const }
              return (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{ticket.customer?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{ticket.customer?.email ?? '—'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-gray-700 line-clamp-2 max-w-xs">{ticket.subject}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">{formatDate(ticket.createdAt)}</td>
                  <td className="py-3 px-4">
                    <Button size="sm" variant="outline" onClick={() => setActiveTicket(ticket)}>
                      Responder
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
