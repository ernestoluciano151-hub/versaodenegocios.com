import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/products
// Params: q, categoryId, visibility, condition, stockStatus, page, limit, sort, order
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const q          = sp.get('q') ?? ''
  const categoryId = sp.get('categoryId') ?? ''
  const visibility = sp.get('visibility') ?? ''
  const condition  = sp.get('condition') ?? ''
  const stockStatus = sp.get('stockStatus') ?? '' // 'low' | 'out' | 'ok'
  const page       = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit      = Math.min(100, Math.max(10, parseInt(sp.get('limit') ?? '25')))
  const sort       = sp.get('sort') ?? 'updatedAt'
  const order      = (sp.get('order') ?? 'desc') as 'asc' | 'desc'

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { deletedAt: null }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { barcode: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (categoryId) where.categoryId = categoryId
  if (visibility) where.visibility = visibility
  if (condition)  where.condition  = condition
  if (stockStatus === 'out') where.stock = 0

  // "low stock" requires field-to-field comparison — get IDs via raw query
  if (stockStatus === 'low') {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM products WHERE deleted_at IS NULL AND stock > 0 AND stock <= min_stock AND visibility != 'archived'
    `
    where.id = { in: rows.map(r => r.id) }
  }

  // Allowed sort fields
  const SORT_FIELDS: Record<string, boolean> = { name:true, price:true, stock:true, createdAt:true, updatedAt:true }
  const orderBy = SORT_FIELDS[sort] ? { [sort]: order } : { updatedAt: 'desc' as const }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count:   { select: { variants: true, reviews: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  // Compute summary stats in parallel
  const [totalAll, archived, outOfStock, lowStockRows] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, visibility: 'archived' } }),
    prisma.product.count({ where: { deletedAt: null, stock: 0, visibility: { not: 'archived' } } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM products
      WHERE deleted_at IS NULL AND stock > 0 AND stock <= min_stock AND visibility != 'archived'
    `,
  ])
  const lowStock = Number(lowStockRows[0]?.count ?? 0)

  return NextResponse.json({
    products,
    total,
    pages: Math.ceil(total / limit),
    page,
    stats: {
      total: totalAll,
      archived,
      outOfStock,
      lowStock,
      active: totalAll - archived,
    },
  })
}

// PATCH /api/admin/products — bulk operations
// Body: { ids: string[], action: 'archive'|'unarchive'|'activate'|'deactivate'|'delete'|'visibility', value?: string }
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { ids, action, value } = await req.json()

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
  }

  switch (action) {
    case 'archive':
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { visibility: 'archived' } })
      break
    case 'unarchive':
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { visibility: 'visible' } })
      break
    case 'activate':
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: true } })
      break
    case 'deactivate':
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: false } })
      break
    case 'delete':
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date(), visibility: 'archived' } })
      break
    case 'visibility':
      if (!value) return NextResponse.json({ error: 'value obrigatório' }, { status: 400 })
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { visibility: value as never } })
      break
    case 'featured':
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { featured: value === 'true' } })
      break
    default:
      return NextResponse.json({ error: 'Acção inválida' }, { status: 400 })
  }

  return NextResponse.json({ success: true, affected: ids.length })
}
