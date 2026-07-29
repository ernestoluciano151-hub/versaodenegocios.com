import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomer } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const addresses = await prisma.address.findMany({
    where: { customerId: session!.id },
    take: 20,
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const { error: authError, customer: session } = await requireCustomer(req)
  if (authError) return authError
  const body = await req.json()
  const { label, street, city, province, municipality, district, reference, country, zipCode, isDefault } = body

  if (isDefault) {
    await prisma.address.updateMany({ where: { customerId: session!.id }, data: { isDefault: false } })
  }

  const address = await prisma.address.create({
    data: { customerId: session!.id, label: label ?? 'Casa', street, city, province, municipality, district, reference, country: country ?? 'Angola', zipCode, isDefault: isDefault ?? false },
  })
  return NextResponse.json(address, { status: 201 })
}
