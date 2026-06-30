export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TopBar } from '@/components/admin/TopBar'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search, Edit, Package } from 'lucide-react'

async function getProducts(search?: string) {
  return prisma.product.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
}

async function ProductsTable({ search }: { search?: string }) {
  const products = await getProducts(search)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Produto</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">SKU</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Preço</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actualizado</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 relative bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400 m-auto" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.brand}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.sku}</td>
              <td className="py-3 px-4 text-gray-600">{p.category.name}</td>
              <td className="py-3 px-4">
                {p.salePrice ? (
                  <div>
                    <p className="font-medium text-orange-500">{formatCurrency(Number(p.salePrice))}</p>
                    <p className="text-xs text-gray-400 line-through">{formatCurrency(Number(p.price))}</p>
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">{formatCurrency(Number(p.price))}</p>
                )}
              </td>
              <td className="py-3 px-4">
                <span className={`font-medium ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-orange-500' : 'text-gray-900'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  <Badge variant={p.active ? 'success' : 'secondary'}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {p.featured && <Badge variant="default" className="text-xs">Destaque</Badge>}
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-gray-400">{formatDate(p.updatedAt)}</td>
              <td className="py-3 px-4">
                <Link href={`/admin/produtos/${p.id}`}>
                  <Button size="sm" variant="ghost">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum produto encontrado.</p>
        </div>
      )}
    </div>
  )
}

export default async function ProdutosAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Produtos" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
            <form className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Pesquisar produtos..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>
            </form>
            <Link href="/admin/produtos/novo">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Produto
              </Button>
            </Link>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-gray-500">A carregar...</div>}>
            <ProductsTable search={q} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
