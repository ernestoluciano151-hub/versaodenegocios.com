export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { AlertTriangle, Package } from 'lucide-react'

async function getStockData(filter?: string) {
  const where =
    filter === 'low' ? { active: true, stock: { lte: 5 } } // approximate, no field ref comparison
    : filter === 'out' ? { active: true, stock: 0 }
    : { active: true }

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, name: true, brand: true, sku: true, stock: true, minStock: true, images: true, category: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 100,
    }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { product: { select: { name: true, sku: true } } },
    }),
  ])
  return { products, movements }
}

export default async function StockPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams
  const { products, movements } = await getStockData(filter)

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock)
  const outOfStock = products.filter(p => p.stock === 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Gestão de Stock" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Package className="w-5 h-5 text-gray-400 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            <p className="text-xs text-gray-500">Produtos Activos</p>
          </div>
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 mb-1" />
            <p className="text-2xl font-bold text-orange-600">{lowStock.length}</p>
            <p className="text-xs text-orange-600">Stock Baixo</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
            <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
            <p className="text-xs text-red-600">Esgotados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <Package className="w-5 h-5 text-gray-400 mb-1" />
            <p className="text-2xl font-bold text-gray-900">{products.reduce((s, p) => s + p.stock, 0)}</p>
            <p className="text-xs text-gray-500">Total Unidades</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Stock table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex gap-2">
              {[
                { value: '', label: 'Todos' },
                { value: 'low', label: 'Stock Baixo' },
                { value: 'out', label: 'Esgotados' },
              ].map(opt => (
                <Link
                  key={opt.value}
                  href={`/admin/stock${opt.value ? `?filter=${opt.value}` : ''}`}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filter === opt.value || (!filter && !opt.value) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Mínimo</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const status = p.stock === 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'ok'
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/admin/produtos/${p.id}`} className="font-medium text-gray-900 hover:text-orange-500 text-sm block truncate max-w-[200px]">
                            {p.name}
                          </Link>
                          <span className="text-xs text-gray-400">{p.brand} · {p.category.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.sku}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">{p.stock}</td>
                        <td className="py-3 px-4 text-gray-500">{p.minStock}</td>
                        <td className="py-3 px-4">
                          <Badge variant={status === 'out' ? 'destructive' : status === 'low' ? 'warning' : 'success'}>
                            {status === 'out' ? 'Esgotado' : status === 'low' ? 'Stock Baixo' : 'OK'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {products.length === 0 && <p className="text-center py-10 text-gray-400 text-sm">Nenhum produto</p>}
            </div>
          </div>

          {/* Recent movements */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Últimos Movimentos</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {movements.map((m) => (
                <li key={m.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{m.product.name}</span>
                    <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'destructive' : 'secondary'} className="text-xs">
                      {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '~'}{m.quantity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">{m.reference ?? m.type} · {formatDate(m.createdAt)}</p>
                </li>
              ))}
              {movements.length === 0 && <p className="px-4 py-6 text-sm text-gray-400">Sem movimentos</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
