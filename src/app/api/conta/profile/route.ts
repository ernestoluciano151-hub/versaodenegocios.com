import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, nif: true, totalSpent: true, ordersCount: true, createdAt: true, active: true },
  })
  return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const { name, phone, nif, avatar, currentPassword, newPassword } = body

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (nif !== undefined) updateData.nif = nif
  if (avatar !== undefined) updateData.avatar = avatar

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Palavra-passe actual obrigatória' }, { status: 400 })
    const customer = await prisma.customer.findUnique({ where: { id: session.id } })
    if (!customer?.password) return NextResponse.json({ error: 'Sem palavra-passe definida' }, { status: 400 })
    const valid = await bcrypt.compare(currentPassword, customer.password)
    if (!valid) return NextResponse.json({ error: 'Palavra-passe actual incorrecta' }, { status: 400 })
    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.customer.update({ where: { id: session.id }, data: updateData })
  return NextResponse.json({ success: true, name: updated.name })
}
