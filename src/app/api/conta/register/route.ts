import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, email, phone, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Nome, email e palavra-passe obrigatórios' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Palavra-passe deve ter pelo menos 6 caracteres' }, { status: 400 })

  const existing = await prisma.customer.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email já registado' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  const customer = await prisma.customer.create({
    data: { name, email, phone: phone || null, password: hashed },
  })
  return NextResponse.json({ id: customer.id, name: customer.name, email: customer.email }, { status: 201 })
}
