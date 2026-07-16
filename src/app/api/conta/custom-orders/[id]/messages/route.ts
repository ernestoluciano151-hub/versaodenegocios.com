import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }

  const order = await prisma.customOrder.findUnique({
    where: { id },
    select: { id: true, customerId: true, reference: true, deletedAt: true },
  })

  if (!order || order.customerId !== customer.id || order.deletedAt) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  const message = await prisma.customOrderMessage.create({
    data: {
      customOrderId: id,
      author: 'customer',
      text: body.text,
      attachments: [],
    },
  })

  // Notificação para o admin
  await prisma.notification.create({
    data: {
      type: 'custom_order_customer_message',
      title: 'Nova mensagem do cliente',
      message: `O cliente ${customer.name} enviou uma mensagem na encomenda ${order.reference}.`,
      data: { orderId: id, customerId: customer.id },
    },
  })

  return NextResponse.json(message, { status: 201 })
}
