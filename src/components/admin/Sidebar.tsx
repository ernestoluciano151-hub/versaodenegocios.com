'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag, Users, ShoppingBag, CreditCard,
  Warehouse, Plane, Building2, TrendingUp, Megaphone, FileBarChart,
  Settings, Zap, ChevronLeft, ChevronRight, LifeBuoy, Mail,
} from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/admin/stock', label: 'Stock', icon: Warehouse },
  { href: '/admin/importacoes', label: 'Importações', icon: Plane },
  { href: '/admin/fornecedores', label: 'Fornecedores', icon: Building2 },
  { href: '/admin/financeiro', label: 'Financeiro', icon: TrendingUp },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileBarChart },
  { href: '/admin/suporte', label: 'Suporte', icon: LifeBuoy },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-gray-900 text-gray-300 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-800">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && <span className="font-bold text-white truncate">VN Commerce Admin</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-orange-500 text-white' : 'hover:bg-gray-800 hover:text-white'
                  )}
                  title={!sidebarOpen ? label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-gray-800 hover:bg-gray-800 transition-colors"
        aria-label="Colapsar sidebar"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  )
}
