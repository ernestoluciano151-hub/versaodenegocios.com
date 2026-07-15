import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.customOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  return NextResponse.json(order)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const {
    quotedPrice,
    quotedDeadline,
    quotedShipping,
    quotedConditions,
    adminNotes,
    supplierId,
    status,
  } = body

  const data: Record<string, unknown> = {}
  if (quotedPrice !== undefined) data.quotedPrice = parseFloat(quotedPrice)
  if (quotedDeadline !== undefined) data.quotedDeadline = quotedDeadline ? new Date(quotedDeadline) : null
  if (quotedShipping !== undefined) data.quotedShipping = parseFloat(quotedShipping)
  if (quotedConditions !== undefined) data.quotedConditions = quotedConditions
  if (adminNotes !== undefined) data.adminNotes = adminNotes
  if (supplierId !== undefined) data.supplierId = supplierId
  if (status !== undefined) data.status = status

  const order = await prisma.customOrder.update({
    where: { id },
    data,
  })

  return NextResponse.json(order)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.customOrder.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json(order)
}
