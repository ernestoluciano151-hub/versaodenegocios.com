'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bell, CheckCheck, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomerRoute } from '@/lib/notification-routes'
import { Suspense } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: { route?: string; orderId?: string; entityId?: string; entityType?: string } | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
}

const TYPE_ICONS: Record<string, string> = {
  order: '📦', order_created: '📦', order_confirmed: '✅', order_shipped: '🚚', order_delivered: '🏠',
  payment: '💳', payment_confirmed: '💳', payment_failed: '❌',
  invoice: '🧾', invoice_issued: '🧾',
  reservation: '📅', reservation_confirmed: '📅', reservation_cancelled: '📅',
  crm: '👤', customer: '👤', new_customer: '👤', loyalty: '⭐', fidelizacao: '⭐',
  affiliate: '🤝', affiliate_commission: '🤝', affiliate_payout: '💰',
  custom_order: '🎨', custom_order_message: '💬', custom_order_status: '🎨',
  custom_order_customer_message: '💬', new_custom_order: '🎨',
  system: '🔔', news: '✨', promotion: '🔥', info: 'ℹ️', alert: '⚠️',
}

const FILTER_TABS = [
  { key: 'todas', label: 'Todas' },
  { key: 'nao_lidas', label: 'Não lidas' },
  { key: 'lidas', label: 'Lidas' },
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'pagamentos', label: 'Pagamentos' },
  { key: 'facturas', label: 'Facturas' },
  { key: 'reservas', label: 'Reservas' },
  { key: 'crm', label: 'CRM' },
  { key: 'afiliados', label: 'Afiliados' },
  { key: 'encomendas', label: 'Encomendas' },
  { key: 'sistema', label: 'Sistema' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `há ${days}d`
  return new Date(dateStr).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
}

function NotificationsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filter, setFilter] = useState(searchParams.get('filter') ?? 'todas')
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [marking, setMarking] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async (f: string, s: string, page: number, append = false) => {
    if (page === 1 && !append) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({ filter: f, page: String(page) })
    if (s) params.set('search', s)

    const res = await fetch(`/api/conta/notifications?${params}`)
    if (res.ok) {
      const data = await res.json()
      setNotifications(prev => append ? [...prev, ...(data.notifications ?? [])] : (data.notifications ?? []))
      setPagination(data.pagination ?? null)
      setUnreadCount(data.unreadCount ?? 0)
    }
    setLoading(false)
    setLoadingMore(false)
  }, [])

  // Initial load and on filter/search change
  useEffect(() => {
    load(filter, search, 1, false)
  }, [filter, search, load])

  // Infinite scroll sentinel
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination?.hasMore && !loadingMore) {
        load(filter, search, (pagination.page ?? 1) + 1, true)
      }
    }, { threshold: 0.1 })

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)

    return () => observerRef.current?.disconnect()
  }, [pagination, loadingMore, filter, search, load])

  function handleFilterChange(key: string) {
    setFilter(key)
    setNotifications([])
    setPagination(null)
  }

  function handleSearchChange(val: string) {
    setSearchInput(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(val)
      setNotifications([])
      setPagination(null)
    }, 400)
  }

  async function markRead(id: string) {
    setMarking(id)
    const res = await fetch(`/api/conta/notifications/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    }
    setMarking(null)
  }

  async function markAllRead() {
    setMarkingAll(true)
    const res = await fetch('/api/conta/notifications', { method: 'PATCH' })
    if (res.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    }
    setMarkingAll(false)
  }

  async function handleClick(n: Notification) {
    if (!n.read) await markRead(n.id)
    const route = getCustomerRoute(n.type, n.data)
    if (route) router.push(route)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}` : 'Todas lidas'}
            {pagination && ` · ${pagination.total} no total`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={markAllRead}
            disabled={markingAll}
            className="gap-2 text-gray-600 text-sm"
          >
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar notificações..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter tabs (scrollable) */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 min-w-max">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma notificação</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Nenhum resultado para a pesquisa' : 'Ainda não tem notificações nesta categoria'}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const route = getCustomerRoute(n.type, n.data)
                const clickable = !!route || !n.read

                return (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`px-5 py-4 flex items-start gap-4 transition-colors
                      ${n.read ? 'bg-white' : 'bg-orange-50/50'}
                      ${clickable ? 'cursor-pointer hover:bg-orange-50' : ''}
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                      {TYPE_ICONS[n.type] ?? '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {n.title}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                            {route && (
                              <span className="text-xs text-orange-500">Ver detalhes →</span>
                            )}
                          </div>
                        </div>
                        {!n.read && (
                          <button
                            onClick={e => { e.stopPropagation(); markRead(n.id) }}
                            disabled={marking === n.id}
                            className="flex-shrink-0 text-xs text-orange-500 hover:underline"
                          >
                            {marking === n.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : 'Lida'}
                          </button>
                        )}
                      </div>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
              </div>
            )}
            {!loadingMore && pagination && !pagination.hasMore && notifications.length > 0 && (
              <p className="text-center text-xs text-gray-400 py-4">
                Fim das notificações ({pagination.total} no total)
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ContaNotificacoesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    }>
      <NotificationsPageInner />
    </Suspense>
  )
}
