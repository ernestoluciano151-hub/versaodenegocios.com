import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, nif: true, totalSpent: true, ordersCount: true, createdAt: true, active: true, prefEmails: true, prefPromos: true, prefNotifications: true },
  })
  return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const { name, phone, nif, avatar, currentPassword, newPassword, prefEmails, prefPromos, prefNotifications } = body

  const updateData: Record<string, unknown> = {}
  if (name) updateData.name = name
  if (phone !== undefined) updateData.phone = phone
  if (nif !== undefined) updateData.nif = nif
  if (avatar !== undefined) updateData.avatar = avatar
  if (prefEmails !== undefined) updateData.prefEmails = prefEmails
  if (prefPromos !== undefined) updateData.prefPromos = prefPromos
  if (prefNotifications !== undefined) updateData.prefNotifications = prefNotifications

  if (newPassword) {
    // Rate limit: 5 password-change attempts per 15 min per customer
    const rl = rateLimit(`profile-pw:${session.id}`, 5, 15 * 60_000)
    if (!rl.allowed) return NextResponse.json({ error: 'Demasiadas tentativas. Aguarde antes de tentar novamente.' }, { status: 429 })

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
