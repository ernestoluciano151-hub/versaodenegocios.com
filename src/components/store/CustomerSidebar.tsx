'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, ShoppingBag, Heart, MapPin, CreditCard,
  User, Bell, HelpCircle, LogOut, ChevronRight, Star, Users,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/conta', label: 'Painel', icon: LayoutDashboard, exact: true },
  { href: '/conta/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/conta/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/conta/enderecos', label: 'Endereços', icon: MapPin },
  { href: '/conta/pagamentos', label: 'Pagamentos', icon: CreditCard },
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

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
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
                  <ChevronRight className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-gray-300'}`} />
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
  )
}
