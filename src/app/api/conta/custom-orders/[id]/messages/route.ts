import { NextRequest, NextResponse } from 'next/server'
import { requireCustomer } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, customer } = await requireCustomer(req)
  if (authError) return authError

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
      data: { orderId: id, customerId: customer.id, route: `/admin/encomendas-personalizadas/${id}` },
    },
  })

  return NextResponse.json(message, { status: 201 })
}
