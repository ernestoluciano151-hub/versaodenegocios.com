'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag, Users, ShoppingBag, CreditCard,
  Warehouse, Plane, Building2, TrendingUp, Megaphone, FileBarChart,
  Settings, Zap, LifeBuoy, Mail, MessageSquare, Star, UserCheck,
  BarChart3, X, ClipboardList,
} from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/encomendas-personalizadas', label: 'Enc. Personalizadas', icon: ClipboardList },
  { href: '/admin/pagamentos', label: 'Pagamentos', icon: CreditCard },
  { href: '/admin/stock', label: 'Stock', icon: Warehouse },
  { href: '/admin/importacoes', label: 'Importações', icon: Plane },
  { href: '/admin/fornecedores', label: 'Fornecedores', icon: Building2 },
  { href: '/admin/financeiro', label: 'Financeiro', icon: TrendingUp },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileBarChart },
  { href: '/admin/suporte', label: 'Suporte', icon: LifeBuoy },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/fidelizacao', label: 'Fidelização', icon: Star },
  { href: '/admin/afiliados', label: 'Afiliados', icon: UserCheck },
  { href: '/admin/notificacoes', label: 'WhatsApp', icon: MessageSquare },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function MobileSidebar() {
  const pathname = usePathname()
  const { mobileMenuOpen, closeMobileMenu } = useUIStore()

  // Fechar ao navegar
  useEffect(() => { closeMobileMenu() }, [pathname, closeMobileMenu])

  // Bloquear scroll quando aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  if (!mobileMenuOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={closeMobileMenu}
      />
      {/* Drawer */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-gray-300 z-50 flex flex-col md:hidden animate-slide-in">
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">VN Commerce</span>
          </div>
          <button
            onClick={closeMobileMenu}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-orange-500 text-white' : 'hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
