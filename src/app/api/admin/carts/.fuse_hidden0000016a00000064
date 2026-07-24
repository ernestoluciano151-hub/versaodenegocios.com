import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return (session?.user as { type?: string })?.type === 'admin'
}

/** GET /api/admin/carts — listar carrinhos abandonados (com itens) */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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
