import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'
import { rateLimit } from '@/lib/rate-limit'
import { sanitizeText } from '@/lib/sanitize'

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

  // Rate limit: 3 tickets por hora por cliente
  const rl = rateLimit(`support:${session.id}`, 3, 60 * 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas mensagens. Aguarde antes de enviar outra.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })

  const subject = sanitizeText(body.subject, 200)
  const message = sanitizeText(body.message, 5000)

  if (!subject || subject.length < 3) return NextResponse.json({ error: 'Assunto obrigatório (mín. 3 caracteres).' }, { status: 400 })
  if (!message || message.length < 10) return NextResponse.json({ error: 'Mensagem obrigatória (mín. 10 caracteres).' }, { status: 400 })

  const ticket = await prisma.supportTicket.create({
    data: { customerId: session.id, subject, message },
  })
  return NextResponse.json(ticket, { status: 201 })
}
