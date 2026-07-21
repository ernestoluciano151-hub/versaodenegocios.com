export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { ProductsCatalog } from './ProductsCatalog'
import type { ProductRow } from './ProductsCatalog'

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhere(params: Record<string, string | undefined>): any {
  const { q, categoryId, visibility, condition, stockStatus } = params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (q) {
    where.OR = [
      { name:    { contains: q, mode: 'insensitive' } },
      { brand:   { contains: q, mode: 'insensitive' } },
      { sku:     { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (categoryId)           where.categoryId = categoryId
  if (visibility)           where.visibility = visibility
  if (condition)            where.condition  = condition
  if (stockStatus === 'out') where.stock = 0
  if (stockStatus === 'ok')  where.stock = { gt: 0 }
  return where
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProdutosAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp     = await searchParams
  const q           = sp.q ?? ''
  const categoryId  = sp.categoryId ?? ''
  const visibility  = sp.visibility ?? ''
  const condition   = sp.condition ?? ''
  const stockStatus = sp.stockStatus ?? ''
  const page        = Math.max(1, parseInt(sp.page ?? '1'))
  const limit       = 25
  const sort        = sp.sort ?? 'updatedAt'
  const order       = (sp.order ?? 'desc') as 'asc' | 'desc'

  const ALLOWED_SORT = new Set(['name', 'price', 'stock', 'createdAt', 'updatedAt'])
  const orderBy = ALLOWED_SORT.has(sort) ? { [sort]: order } : { updatedAt: 'desc' as const }

  const where = buildWhere({ q, categoryId, visibility, condition, stockStatus })

  // ── "Low stock" filter needs JS-side filtering (field comparison) ──
  let productRows: ProductRow[]
  let total: number

  if (stockStatus === 'low') {
    // Fetch all in-stock products and filter by stock <= minStock
    const all = await prisma.product.findMany({
      where: { ...where, stock: { gt: 0 } },
      include: { category: { select: { id: true, name: true } } },
      orderBy,
    })
    const filtered = all.filter(p => p.stock <= p.minStock)
    total = filtered.length
    productRows = filtered.slice((page - 1) * limit, page * limit) as unknown as ProductRow[]
  } else {
    ;[productRows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy,
        skip:  (page - 1) * limit,
        take:  limit,
      }) as unknown as Promise<ProductRow[]>,
      prisma.product.count({ where }),
    ])
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const [totalAll, outOfStock, allForLowStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.findMany({ select: { stock: true, minStock: true }, where: { stock: { gt: 0 } } }),
  ])
  const lowStockCount = allForLowStock.filter(p => p.stock <= p.minStock).length

  // Archived — gracefully try in case enum not yet in DB
  let archived = 0
  try { archived = await prisma.product.count({ where: { visibility: 'archived' as never } }) } catch { archived = 0 }

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const stats = {
    total:      totalAll,
    active:     totalAll - archived,
    archived,
    outOfStock,
    lowStock:   lowStockCount,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Produtos" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Suspense>
          <ProductsCatalog
            products={productRows}
            total={total}
            pages={Math.ceil(total / limit)}
            page={page}
            stats={stats}
            categories={categories}
          />
        </Suspense>
      </div>
    </div>
  )
}
