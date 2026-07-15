'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, Trash2, X, Package, ShoppingBag, User, AlertCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'order' | 'product' | 'customer' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
}

const iconMap = {
  order: ShoppingBag,
  product: Package,
  customer: User,
  system: AlertCircle,
}

const colorMap = {
  order: 'text-blue-500 bg-blue-50',
  product: 'text-orange-500 bg-orange-50',
  customer: 'text-green-500 bg-green-50',
  system: 'text-red-500 bg-red-50',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora mesmo'
  if (m < 60) return `há ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/admin/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    setLoading(true)
    await fetch('/api/admin/notifications/read-all', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setLoading(false)
  }

  async function deleteNotification(id: string) {
    await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notificações</h3>
              {unread > 0 && (
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium px-2 py-1 rounded hover:bg-orange-50"
                >
                  <Check className="w-3.5 h-3.5 inline mr-1" />
                  Marcar tudo
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                Sem notificações
              </div>
            ) : (
              notifications.map(n => {
                const Icon = iconMap[n.type]
                const colors = colorMap[n.type]
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-3 hover:bg-gray-50 cursor-pointer group transition-colors ${!n.read ? 'bg-orange-50/30' : ''}`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-600'} line-clamp-1`}>
                        {n.title}
                        {!n.read && <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-orange-500 rounded-full align-middle" />}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-1">{n.message}</p>
                      <p className="text-xs text-gray-300 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(n.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
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
