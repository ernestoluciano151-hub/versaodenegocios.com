import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const validValues = [
  'visible',
  'hidden',
  'maintenance',
  'out_of_stock',
  'catalog_only',
  'members_only',
  'affiliates_only',
  'archived',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { id } = await params
  const body = await req.json()

  if (!validValues.includes(body.visibility)) {
    return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      visibility: body.visibility,
      active: body.visibility === 'visible',
    },
    select: { id: true, visibility: true, active: true, name: true },
  })

  return NextResponse.json(product)
}
