import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = [
  'received',
  'analyzing',
  'negotiating',
  'approved',
  'rejected',
  'purchasing',
  'in_transit',
  'delivered',
  'cancelled',
] as const

type CustomOrderStatus = (typeof VALID_STATUSES)[number]

function getStatusNotificationMessage(status: CustomOrderStatus, reference: string): string {
  const messages: Record<CustomOrderStatus, string> = {
    received: `A sua encomenda ${reference} foi recebida e está a ser processada.`,
    analyzing: `A sua encomenda ${reference} está a ser analisada pela nossa equipa.`,
    negotiating: `A sua encomenda ${reference} está em fase de negociação. Aguarde contacto.`,
    approved: `A sua encomenda ${reference} foi aprovada! Em breve terá novidades.`,
    rejected: `A sua encomenda ${reference} não pôde ser aprovada. Entre em contacto para mais informações.`,
    purchasing: `A sua encomenda ${reference} está em processo de compra ao fornecedor.`,
    in_transit: `A sua encomenda ${reference} está em trânsito.`,
    delivered: `A sua encomenda ${reference} foi entregue. Obrigado pela preferência!`,
    cancelled: `A sua encomenda ${reference} foi cancelada.`,
  }
  return messages[status]
}

function getStatusNotificationTitle(status: CustomOrderStatus): string {
  const titles: Record<CustomOrderStatus, string> = {
    received: 'Encomenda recebida',
    analyzing: 'Encomenda em análise',
    negotiating: 'Encomenda em negociação',
    approved: 'Encomenda aprovada',
    rejected: 'Encomenda não aprovada',
    purchasing: 'Encomenda em compra',
    in_transit: 'Encomenda em trânsito',
    delivered: 'Encomenda entregue',
    cancelled: 'Encomenda cancelada',
  }
  return titles[status]
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status } = body

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores válidos: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const order = await prisma.customOrder.findUnique({
    where: { id },
    select: { id: true, customerId: true, reference: true },
  })

  if (!order) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  const updated = await prisma.customOrder.update({
    where: { id },
    data: { status },
  })

  await prisma.notification.create({
    data: {
      customerId: order.customerId,
      type: 'custom_order_status',
      title: getStatusNotificationTitle(status),
      message: getStatusNotificationMessage(status, order.reference),
      data: { orderId: id, status },
    },
  })

  return NextResponse.json(updated)
}
