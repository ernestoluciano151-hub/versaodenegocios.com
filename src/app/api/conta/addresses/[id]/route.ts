import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/customer-auth'

async function owns(customerId: string, addressId: string) {
  const a = await prisma.address.findUnique({ where: { id: addressId } })
  return a?.customerId === customerId
}

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const { id } = await params
  if (!(await owns(session.id, id))) return NextResponse.json({ error: 'Proibido' }, { status: 403 })
  const body = await req.json()
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { customerId: session.id }, data: { isDefault: false } })
  }
  const address = await prisma.address.update({ where: { id }, data: body })
  return NextResponse.json(address)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const { id } = await params
  if (!(await owns(session.id, id))) return NextResponse.json({ error: 'Proibido' }, { status: 403 })
  await prisma.address.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
