'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Package, Tag, Users, ShoppingBag, CreditCard,
  Warehouse, Plane, Building2, TrendingUp, Megaphone, FileBarChart,
  Settings, ChevronLeft, ChevronRight, LifeBuoy, Mail,
  MessageSquare, Star, UserCheck, BarChart3, ClipboardList,
  ShoppingCart, Truck, Image,
} from 'lucide-react'
import NextImage from 'next/image'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'
import { isSuperRole, hasPermission, type PermissionKey, type PermissionMap } from '@/lib/permissions'

// Mapeamento de cada item de nav para a permissão necessária.
// undefined = sempre visível (Dashboard, Configurações gerais)
type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission?: PermissionKey
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',                          label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/produtos',                 label: 'Produtos',          icon: Package,       permission: 'canEditProducts' },
  { href: '/admin/categorias',               label: 'Categorias',        icon: Tag,           permission: 'canEditProducts' },
  { href: '/admin/clientes',                 label: 'Clientes',          icon: Users,         permission: 'canViewCustomers' },
  { href: '/admin/pedidos',                  label: 'Pedidos',           icon: ShoppingBag,   permission: 'canManageOrders' },
  { href: '/admin/pagamentos',               label: 'Pagamentos',        icon: CreditCard,    permission: 'canCancelPayments' },
  { href: '/admin/encomendas-personalizadas', label: 'Enc. Custom',      icon: ClipboardList, permission: 'canManageOrders' },
  { href: '/admin/stock',                    label: 'Stock',             icon: Warehouse,     permission: 'canManageInventory' },
  { href: '/admin/logistica',                label: 'Logística',         icon: Truck,         permission: 'canManageOrders' },
  { href: '/admin/importacoes',              label: 'Importações',       icon: Plane,         permission: 'canManageInventory' },
  { href: '/admin/fornecedores',             label: 'Fornecedores',      icon: Building2,     permission: 'canManageInventory' },
  { href: '/admin/financeiro',               label: 'Financeiro',        icon: TrendingUp,    permission: 'canViewFinancial' },
  { href: '/admin/banners',                  label: 'Banners',           icon: Image,         permission: 'canEditProducts' },
  { href: '/admin/carrinhos',                label: 'Carrinhos',         icon: ShoppingCart,  permission: 'canViewCustomers' },
  { href: '/admin/avaliacoes',               label: 'Avaliações',        icon: Star,          permission: 'canManageOrders' },
  { href: '/admin/marketing',                label: 'Marketing',         icon: Megaphone,     permission: 'canEditProducts' },
  { href: '/admin/newsletter',               label: 'Newsletter',        icon: Mail,          permission: 'canEditProducts' },
  { href: '/admin/relatorios',               label: 'Relatórios',        icon: FileBarChart,  permission: 'canViewFinancial' },
  { href: '/admin/suporte',                  label: 'Suporte',           icon: LifeBuoy,      permission: 'canManageOrders' },
  { href: '/admin/analytics',                label: 'Analytics',         icon: BarChart3,     permission: 'canViewFinancial' },
  { href: '/admin/fidelizacao',              label: 'Fidelização',       icon: Star,          permission: 'canManageOrders' },
  { href: '/admin/afiliados',                label: 'Afiliados',         icon: UserCheck,     permission: 'canViewFinancial' },
  { href: '/admin/coordenadas-bancarias',    label: 'Coord. Bancárias',  icon: CreditCard,    permission: 'canChangeSettings' },
  { href: '/admin/notificacoes',             label: 'WhatsApp',          icon: MessageSquare, permission: 'canManageOrders' },
  { href: '/admin/configuracoes',            label: 'Configurações',     icon: Settings,      permission: 'canChangeSettings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { data: session } = useSession()

  const role = (session?.user as { role?: string } | null)?.role ?? ''
  const permissions = (session?.user as { permissions?: PermissionMap } | null)?.permissions

  // Filtra os itens que o utilizador tem permissão para ver.
  // SUPER_ADMIN e ADMIN vêem tudo.
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true           // sem restrição (Dashboard)
    if (isSuperRole(role)) return true          // super admins vêem tudo
    return hasPermission(permissions, item.permission)
  })

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-gray-900 text-gray-300 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-800">
        <NextImage src="/logo.svg" alt="VN Commerce" width={32} height={32} className="rounded-lg flex-shrink-0" />
        {sidebarOpen && <span className="font-bold text-white truncate">VN Commerce Admin</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {visibleItems.map(({ href, label, icon: Icon }) => {
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
