import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
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
    select: { id: true, customerId: true, reference: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  const message = await prisma.customOrderMessage.create({
    data: {
      orderId: id,
      author: 'admin',
      text: body.text,
      attachments: body.attachments ?? [],
    },
  })

  await prisma.notification.create({
    data: {
      customerId: order.customerId,
      type: 'custom_order_message',
      title: 'Nova resposta à sua encomenda',
      message: `A sua encomenda ${order.reference} tem uma nova resposta.`,
      data: { orderId: id, route: '/conta/encomendas-personalizadas' },
    },
  })

  return NextResponse.json(message, { status: 201 })
}
