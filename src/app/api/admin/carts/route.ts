import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/carts — listar carrinhos abandonados (com itens) */
export async function GET(req: NextRequest) {
  const { error: _authErr } = await requireAdmin(req)
  if (_authErr) return _authErr

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 20
  const skip = (page - 1) * limit

  // Abandoned = carts updated more than 1 hour ago with at least 1 item
  const since = new Date(Date.now() - 60 * 60 * 1000)

  const where = {
    updatedAt: { lt: since },
    items: { some: {} },
  }

  const [carts, total] = await Promise.all([
    prisma.cart.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, salePrice: true, images: true, slug: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.cart.count({ where }),
  ])

  return NextResponse.json({ carts, total, page, pages: Math.ceil(total / limit) })
}
