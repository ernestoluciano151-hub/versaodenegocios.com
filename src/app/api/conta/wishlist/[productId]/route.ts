import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const { productId } = await params
  const item = await prisma.wishlist.upsert({
    where: { customerId_productId: { customerId: session.id, productId } },
    create: { customerId: session.id, productId },
    update: {},
  })
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const { productId } = await params
  await prisma.wishlist.deleteMany({ where: { customerId: session.id, productId } })
  return NextResponse.json({ success: true })
}
