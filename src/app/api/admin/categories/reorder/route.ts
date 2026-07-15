import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { items } = body as { items: { id: string; displayOrder: number }[] }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'O campo "items" deve ser um array não vazio' }, { status: 400 })
    }

    await prisma.$transaction(
      items.map(({ id, displayOrder }) =>
        prisma.category.update({
          where: { id },
          data:  { displayOrder },
        })
      )
    )

    return NextResponse.json({ success: true, updated: items.length })
  } catch (err) {
    console.error('[PATCH /api/admin/categories/reorder]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
