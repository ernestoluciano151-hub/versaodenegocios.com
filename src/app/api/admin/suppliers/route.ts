import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 50)))
  const skip = (page - 1) * limit

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { imports: true } } },
      skip,
      take: limit,
    }),
    prisma.supplier.count(),
  ])
  return NextResponse.json({ suppliers, total, page, totalPages: Math.ceil(total / limit) })
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
