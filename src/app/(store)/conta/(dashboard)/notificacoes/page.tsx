'use client'
import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string; type: string; title: string; message: string; read: boolean; createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  order_confirmed: '✅',
  order_shipped: '🚚',
  order_delivered: '📦',
  promotion: '🔥',
  news: '✨',
  payment: '💳',
}

export default function ContaNotificacoesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/conta/notifications')
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications ?? data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markRead(id: string) {
    setMarking(id)
    await fetch(`/api/conta/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setMarking(null)
  }

  async function markAllRead() {
    await fetch('/api/conta/notifications', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" onClick={markAllRead} className="gap-2 text-gray-600 text-sm">
            <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma notificação</p>
            <p className="text-gray-400 text-sm">Notificações sobre pedidos e promoções aparecerão aqui</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li key={n.id} className={`px-5 py-4 flex items-start gap-4 transition-colors ${n.read ? '' : 'bg-orange-50/50'}`}>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-medium ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('pt-AO', { dateStyle: 'medium' })}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        disabled={marking === n.id}
                        className="flex-shrink-0 text-xs text-orange-500 hover:underline"
                      >
                        {marking === n.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Marcar como lida'}
                      </button>
                    )}
                  </div>
                </div>
                {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
