import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { hashPassword } from '@/lib/password'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search')

  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    select: {
      id: true, name: true, email: true, phone: true,
      totalSpent: true, ordersCount: true, active: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { name, email, phone, password } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Nome e email obrigatórios.' }, { status: 400 })

  const exists = await prisma.customer.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'Email já registado.' }, { status: 409 })

  const hashedPassword = password ? await hashPassword(password) : undefined

  const customer = await prisma.customer.create({
    data: { name, email, phone, password: hashedPassword },
  })

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email }, { status: 201 })
}
