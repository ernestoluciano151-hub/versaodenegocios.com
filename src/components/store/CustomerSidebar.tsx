'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, ShoppingBag, Heart, MapPin, CreditCard,
  User, Bell, HelpCircle, LogOut, ChevronRight, Star, Users, ClipboardList, Menu, X,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useUIStore } from '@/store/ui'

const navItems = [
  { href: '/conta', label: 'Painel', icon: LayoutDashboard, exact: true },
  { href: '/conta/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/conta/enderecos', label: 'Endereços', icon: MapPin },
  { href: '/conta/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/conta/encomendas-personalizadas', label: 'Encomendas Custom', icon: ClipboardList },
  { href: '/conta/perfil', label: 'Perfil', icon: User },
  { href: '/conta/fidelizacao', label: 'Pontos & Níveis', icon: Star },
  { href: '/conta/afiliado', label: 'Programa Afiliado', icon: Users },
  { href: '/conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/conta/suporte', label: 'Suporte', icon: HelpCircle },
]

interface Props {
  customer: { name: string; email: string; image?: string | null }
}

export function CustomerSidebar({ customer }: Props) {
  const pathname = usePathname()
  const { openMobileMenu } = useUIStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; createdAt: string }[]>([])
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch('/api/conta/notifications', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount ?? 0)
          setNotifications((data.notifications ?? []).slice(0, 5))
        }
      } catch { /* silent */ }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(interval)
  }, [])

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    await fetch('/api/conta/notifications', { method: 'PATCH' })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setBellOpen(false)
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      {/* ── Mobile header (only visible on small screens) ── */}
      <div className="flex lg:hidden items-center justify-between mb-4 bg-white rounded-xl border border-gray-200 px-4 py-3">
        <button
          onClick={openMobileMenu}
          aria-label="Abrir menu"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors"
        >
          <Menu className="w-5 h-5" />
          Menu
        </button>

        <h2 className="font-bold text-gray-900 text-sm">Minha Conta</h2>

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(prev => !prev)}
            aria-label="Notificações"
            className="relative p-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-900">Notificações</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
                      Marcar todas como lidas
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  Sem notificações
                </div>
              ) : (
                <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <li key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-orange-50' : ''}`}>
                      <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 py-2 border-t border-gray-100">
                <Link href="/conta/notificacoes" onClick={() => setBellOpen(false)} className="text-xs text-orange-500 hover:underline font-medium">
                  Ver todas as notificações →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop sidebar (only visible on lg+) ── */}
      <aside className="w-full lg:w-64 flex-shrink-0 hidden lg:block">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-3">
            {customer.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.image} alt={customer.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {getInitials(customer.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
              <p className="text-xs text-gray-400 truncate">{customer.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ul>
            {navItems.map((item, i) => {
              const active = isActive(item.href, item.exact)
              const Icon = item.icon
              const isNotif = item.href === '/conta/notificacoes'
              return (
                <li key={item.href} className={i > 0 ? 'border-t border-gray-100' : ''}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 text-sm transition-colors ${active ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                      {item.label}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isNotif && unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-gray-300'}`} />
                    </div>
                  </Link>
                </li>
              )
            })}
            <li className="border-t border-gray-100">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  )
}
