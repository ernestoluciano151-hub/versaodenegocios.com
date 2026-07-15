import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { include: { product: { select: { name: true } } } },
          payments: { select: { paymentStatus: true } },
        },
      },
      addresses: true,
      supportTickets: { orderBy: { createdAt: 'desc' }, take: 5 },
      notes: { orderBy: { createdAt: 'desc' } },
      fraudFlags: { where: { resolved: false } },
      affiliateProfile: { select: { code: true, status: true, totalEarned: true } },
      loyaltyAccount: { select: { points: true, tier: true } },
      _count: { select: { orders: true, wishlists: true, supportTickets: true } },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(customer)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const allowedFields = ['name', 'email', 'phone', 'nif', 'dateOfBirth', 'gender', 'language', 'currency', 'newsletter', 'smsMarketing']
  const data: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field]
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data,
  })

  return NextResponse.json(customer)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const customer = await prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json(customer)
}
