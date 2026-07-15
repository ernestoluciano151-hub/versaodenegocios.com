import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()

    if (typeof body.isVisible !== 'boolean') {
      return NextResponse.json({ error: 'O campo "isVisible" deve ser um boolean' }, { status: 400 })
    }

    const adminId = (session?.user as { id?: string })?.id ?? null

    const category = await prisma.category.update({
      where: { id },
      data:  { isVisible: body.isVisible, updatedBy: adminId },
      select: {
        id: true, name: true, slug: true, isVisible: true, active: true, updatedAt: true,
      },
    })

    return NextResponse.json(category)
  } catch (err: unknown) {
    console.error('[PATCH /api/admin/categories/[id]/visibility]', err)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
