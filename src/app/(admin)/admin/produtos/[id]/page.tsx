export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Package, TrendingUp, AlertTriangle, Layers } from 'lucide-react'
import { ProductEditForm } from './ProductEditForm'
import { VariantsTab } from './VariantsTab'

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventory: true,
      inventoryMoves: { orderBy: { createdAt: 'desc' }, take: 10 },
      orderItems: {
        include: { order: { select: { id: true, createdAt: true, status: true } } },
        orderBy: { order: { createdAt: 'desc' } },
        take: 5,
      },
    },
  })

  if (!product) notFound()

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })

  const totalSold = product.orderItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalRevenue = product.orderItems.reduce((sum, i) => sum + Number(i.salePrice ?? i.price) * i.quantity, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title={product.name}
        actions={
          <Link href="/admin/produtos">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Stock Actual', value: product.stock, icon: Package, alert: product.stock <= product.minStock },
            { label: 'Stock Mínimo', value: product.minStock, icon: AlertTriangle, alert: false },
            { label: 'Total Vendido', value: `${totalSold} un.`, icon: TrendingUp, alert: false },
            { label: 'Receita Total', value: formatCurrency(totalRevenue), icon: TrendingUp, alert: false },
          ].map(({ label, value, icon: Icon, alert }) => (
            <div key={label} className={`bg-white rounded-xl border p-4 ${alert ? 'border-orange-300' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${alert ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className={`text-xl font-bold ${alert ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Edit form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-4 h-4" /> Editar Produto
              </h2>
              <ProductEditForm product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                brand: product.brand,
                categoryId: product.categoryId,
                description: product.description,
                technicalSpecs: product.technicalSpecs as Record<string, string>,
                originCountry: product.originCountry,
                images: product.images,
                warranty: product.warranty ?? '',
                price: Number(product.price),
                salePrice: product.salePrice ? Number(product.salePrice) : undefined,
                sku: product.sku,
                internalCode: product.internalCode ?? '',
                stock: product.stock,
                minStock: product.minStock,
                active: product.active,
                featured: product.featured,
                isNew: product.isNew,
                isBestseller: product.isBestseller,
                weight: product.weight ? Number(product.weight) : undefined,
              }} categories={categories.map(c => ({ id: c.id, name: c.name }))} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Images */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Imagens</h3>
              {product.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {product.images.map((img, i) => (
                    <div key={i} className="aspect-square relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <Image src={img} alt={`img ${i + 1}`} fill className="object-contain p-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sem imagens</p>
              )}
            </div>

            {/* Recent orders */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Últimas Vendas</h3>
              {product.orderItems.length === 0 ? (
                <p className="text-sm text-gray-400">Sem vendas ainda</p>
              ) : (
                <ul className="space-y-2">
                  {product.orderItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <Link href={`/admin/pedidos/${item.orderId}`} className="text-orange-500 hover:underline font-mono text-xs">
                        #{item.orderId.slice(-8).toUpperCase()}
                      </Link>
                      <span className="text-gray-500">{item.quantity}×</span>
                      <span className="font-medium">{formatCurrency(Number(item.salePrice ?? item.price))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Variants */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-400" /> Variantes
              </h3>
              <VariantsTab productId={product.id} />
            </div>

            {/* Inventory movements */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Movimentos de Stock</h3>
              {product.inventoryMoves.length === 0 ? (
                <p className="text-sm text-gray-400">Sem movimentos</p>
              ) : (
                <ul className="space-y-2">
                  {product.inventoryMoves.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'destructive' : 'secondary'} className="text-xs">
                        {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '~'}{m.quantity}
                      </Badge>
                      <span className="text-xs text-gray-400">{m.reference ?? m.type}</span>
                      <span className="text-xs text-gray-400">{formatDate(m.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
