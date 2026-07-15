'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, Filter, ShoppingBag, CreditCard, Package, Ticket, Users, Star, AlertTriangle, ClipboardList } from 'lucide-react'

type NotifType = 'order' | 'payment' | 'stock' | 'ticket' | 'affiliate' | 'custom_order' | 'customer' | 'system'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  data?: Record<string, unknown>
  createdAt: string
}

const TYPE_ICON: Record<string, React.ElementType> = {
  order: ShoppingBag,
  payment: CreditCard,
  stock: Package,
  ticket: Ticket,
  affiliate: Star,
  customer: Users,
  custom_order: ClipboardList,
  system: AlertTriangle,
}

const TYPE_COLOR: Record<string, string> = {
  order: 'bg-blue-100 text-blue-600',
  payment: 'bg-green-100 text-green-600',
  stock: 'bg-orange-100 text-orange-600',
  ticket: 'bg-purple-100 text-purple-600',
  affiliate: 'bg-yellow-100 text-yellow-600',
  customer: 'bg-indigo-100 text-indigo-600',
  custom_order: 'bg-pink-100 text-pink-600',
  system: 'bg-red-100 text-red-600',
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?type=${filter}` : ''
      const res = await fetch(`/api/admin/notifications${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {}
  }, [filter])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markRead(id: string) {
    await fetch(`/api/admin/notifications/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ read: true }) })
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await fetch('/api/admin/notifications/read-all', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({...n, read: true})))
    setUnreadCount(0)
  }

  async function deleteNotif(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })
    const n = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (n && !n.read) setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)

  const FILTERS = [
    { key: 'all', label: 'Todos' },
    { key: 'order', label: 'Pedidos' },
    { key: 'payment', label: 'Pagamentos' },
    { key: 'stock', label: 'Stock' },
    { key: 'ticket', label: 'Tickets' },
    { key: 'custom_order', label: 'Enc. Custom' },
    { key: 'affiliate', label: 'Afiliados' },
  ]

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-gray-900">Notificações</span>
              {unreadCount > 0 && (
                <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Marcar todas como lidas" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1 p-2 border-b border-gray-100 overflow-x-auto">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f.key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem notificações</p>
              </div>
            ) : (
              filtered.map(n => {
                const Icon = TYPE_ICON[n.type] || AlertTriangle
                const color = TYPE_COLOR[n.type] || 'bg-gray-100 text-gray-600'
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors group ${!n.read ? 'bg-orange-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!n.read && (
                        <button onClick={(e) => { e.stopPropagation(); markRead(n.id) }} className="p-1 text-green-500 hover:bg-green-50 rounded">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={(e) => deleteNotif(n.id, e)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
