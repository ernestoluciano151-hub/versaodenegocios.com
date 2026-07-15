'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  X, LayoutDashboard, ShoppingBag, Heart, MapPin, CreditCard,
  User, Bell, HelpCircle, LogOut, Star, Users, ClipboardList, ChevronRight
} from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/conta', label: 'Painel', icon: LayoutDashboard, exact: true },
  { href: '/conta/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/conta/enderecos', label: 'Endereços', icon: MapPin },
  { href: '/conta/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/conta/encomendas-personalizadas', label: 'Enc. Personalizadas', icon: ClipboardList },
  { href: '/conta/perfil', label: 'Perfil', icon: User },
  { href: '/conta/fidelizacao', label: 'Pontos & Níveis', icon: Star },
  { href: '/conta/afiliado', label: 'Programa Afiliado', icon: Users },
  { href: '/conta/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/conta/suporte', label: 'Suporte', icon: HelpCircle },
]

interface Props {
  customer: { name: string; email: string; image?: string | null }
}

export function CustomerMobileDrawer({ customer }: Props) {
  const { mobileMenuOpen, closeMobileMenu } = useUIStore()
  const pathname = usePathname()
  const startXRef = useRef<number>(0)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { closeMobileMenu() }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  function handleTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - startXRef.current
    if (deltaX < -60) closeMobileMenu() // swipe left to close
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  if (!mobileMenuOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={closeMobileMenu}
        style={{ animation: 'fadeIn 200ms ease forwards' }}
      />
      {/* Drawer */}
      <aside
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed left-0 top-0 h-full w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3">
            {customer.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.image} alt={customer.name} className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(customer.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-white truncate text-sm">{customer.name}</p>
              <p className="text-xs text-orange-200 truncate">{customer.email}</p>
            </div>
          </div>
          <button onClick={closeMobileMenu} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${
                  active ? 'bg-orange-50 text-orange-600 font-semibold border-r-2 border-orange-500' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                  {item.label}
                </div>
                <ChevronRight className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-gray-300'}`} />
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-2">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}
