import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export async function GET() {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const tickets = await prisma.supportTicket.findMany({
    where: { customerId: session.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { subject, message } = await req.json()
  if (!subject || !message) return NextResponse.json({ error: 'Assunto e mensagem obrigatórios' }, { status: 400 })
  const ticket = await prisma.supportTicket.create({
    data: { customerId: session.id, subject, message },
  })
  return NextResponse.json(ticket, { status: 201 })
}
