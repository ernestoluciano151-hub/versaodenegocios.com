import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error


  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { imports: true } } },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error


  const body = await req.json()
  const { name, country, contact, email, phone, website, notes, active } = body
  const supplier = await prisma.supplier.create({
    data: {
      name,
      country,
      contact: contact || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      notes: notes || null,
      active: active ?? true,
    },
  })
  return NextResponse.json(supplier, { status: 201 })
}
