import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { productId } = await params
  const item = await prisma.wishlist.upsert({
    where: { customerId_productId: { customerId: session.id, productId } },
    create: { customerId: session.id, productId },
    update: {},
  })
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { productId } = await params
  await prisma.wishlist.deleteMany({ where: { customerId: session.id, productId } })
  return NextResponse.json({ success: true })
}
