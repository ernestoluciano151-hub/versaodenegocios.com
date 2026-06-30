import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export async function GET() {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const addresses = await prisma.address.findMany({
    where: { customerId: session.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const { label, street, city, province, municipality, district, reference, country, zipCode, isDefault } = body

  if (isDefault) {
    await prisma.address.updateMany({ where: { customerId: session.id }, data: { isDefault: false } })
  }

  const address = await prisma.address.create({
    data: { customerId: session.id, label: label ?? 'Casa', street, city, province, municipality, district, reference, country: country ?? 'Angola', zipCode, isDefault: isDefault ?? false },
  })
  return NextResponse.json(address, { status: 201 })
}
