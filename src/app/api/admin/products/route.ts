import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, requirePermission } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/products
// Params: q, categoryId, visibility, condition, stockStatus, page, limit, sort, order
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const sp = req.nextUrl.searchParams
    const q           = sp.get('q') ?? ''
    const categoryId  = sp.get('categoryId') ?? ''
    const visibility  = sp.get('visibility') ?? ''
    const condition   = sp.get('condition') ?? ''
    const stockStatus = sp.get('stockStatus') ?? ''  // 'low' | 'out' | 'ok'
    const page        = Math.max(1, parseInt(sp.get('page') ?? '1'))
    const limit       = Math.min(100, Math.max(10, parseInt(sp.get('limit') ?? '25')))
    const sort        = sp.get('sort') ?? 'updatedAt'
    const order       = (sp.get('order') ?? 'desc') as 'asc' | 'desc'

    // ── Base where (mirrors original page — no deletedAt filter) ──
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
    if (categoryId) where.categoryId = categoryId
    if (visibility) where.visibility = visibility
    if (condition)  where.condition  = condition
    if (stockStatus === 'out') where.stock = 0
    if (stockStatus === 'ok')  where.stock = { gt: 0 }

    // Sorting
    const ALLOWED = new Set(['name', 'price', 'stock', 'createdAt', 'updatedAt'])
    const orderBy = ALLOWED.has(sort) ? { [sort]: order } : { updatedAt: 'desc' as const }

    // Main query + count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy,
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.product.count({ where }),
    ])

    // ── Stats (simple Prisma queries, no raw SQL) ──
    const [totalAll, outOfStock] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: 0 } }),
    ])

    // Low-stock: stock > 0 AND stock <= minStock — fetch in JS for safety
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length

    // Archived (if visibility enum exists in this DB version)
    let archived = 0
    try {
      archived = await prisma.product.count({ where: { visibility: 'archived' as never } })
    } catch { archived = 0 }

    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
      page,
      stats: {
        total:      totalAll,
        active:     totalAll - archived,
        archived,
        outOfStock,
        lowStock:   lowStockCount,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/products]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH /api/admin/products — bulk operations
export async function PATCH(req: NextRequest) {
  const { error } = await requirePermission('canEditProducts', req)
  if (error) return error

  try {
    const { ids, action, value } = await req.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
    }

    // A loja pública só mostra produtos com active=true E visibility='visible'.
    // Mantemos os dois campos sincronizados aqui para que as acções do admin
    // se reflictam sempre correctamente na loja (evita o bug de produto
    // "arquivado"/"oculto" continuar visível porque só um dos campos mudou).
    const VALID_VISIBILITY = new Set([
      'visible', 'hidden', 'maintenance', 'out_of_stock',
      'catalog_only', 'members_only', 'affiliates_only', 'archived',
    ])

    switch (action) {
      case 'archive':
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { visibility: 'archived' as never, active: false } })
        break
      case 'unarchive':
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { visibility: 'visible' as never, active: true } })
        break
      case 'activate':
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: true, visibility: 'visible' as never } })
        break
      case 'deactivate':
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: false } })
        break
      case 'delete':
        // Soft delete — only mark as archived. Hard delete requires separate confirmation.
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { visibility: 'archived' as never, active: false } })
        break
      case 'visibility':
        if (!value || !VALID_VISIBILITY.has(value)) {
          return NextResponse.json({ error: 'Visibilidade inválida' }, { status: 400 })
        }
        await prisma.product.updateMany({
          where: { id: { in: ids } },
          data: { visibility: value as never, active: value === 'visible' },
        })
        break
      case 'featured':
        await prisma.product.updateMany({ where: { id: { in: ids } }, data: { featured: value === 'true' } })
        break
      default:
        return NextResponse.json({ error: 'Acção inválida' }, { status: 400 })
    }

    return NextResponse.json({ success: true, affected: ids.length })
  } catch (err) {
    console.error('[PATCH /api/admin/products]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
