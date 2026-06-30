import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get('search')

  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const { name, email, phone, password } = await req.json()

  const exists = await prisma.customer.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: 'Email já registado.' }, { status: 409 })

  const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined

  const customer = await prisma.customer.create({
    data: { name, email, phone, password: hashedPassword },
  })

  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email }, { status: 201 })
}
