import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.customOrder.findMany({
    where: { customerId: customer.id, deletedAt: null },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    productName,
    origin,
    productLink,
    quantity,
    color,
    model,
    size,
    notes,
    budget,
    categoryId,
  } = body

  if (!productName || String(productName).trim().length === 0) {
    return NextResponse.json({ error: 'O nome do produto é obrigatório.' }, { status: 400 })
  }

  if (!quantity || parseInt(quantity) < 1) {
    return NextResponse.json({ error: 'A quantidade deve ser pelo menos 1.' }, { status: 400 })
  }

  if (!origin || String(origin).trim().length === 0) {
    return NextResponse.json({ error: 'A origem do produto é obrigatória.' }, { status: 400 })
  }

  const year = new Date().getFullYear()
  const count = await prisma.customOrder.count()
  const reference = `EP-${year}-${String(count + 1).padStart(4, '0')}`

  const order = await prisma.customOrder.create({
    data: {
      customerId: customer.id,
      productName: String(productName).trim(),
      origin: String(origin).trim(),
      productLink: productLink ?? null,
      quantity: parseInt(quantity),
      color: color ?? null,
      model: model ?? null,
      size: size ?? null,
      notes: notes ?? null,
      budget: budget ? parseFloat(budget) : null,
      categoryId: categoryId ?? null,
      reference,
      status: 'received',
    },
  })

  // Notificação para o admin
  await prisma.notification.create({
    data: {
      type: 'new_custom_order',
      title: 'Nova Encomenda Personalizada',
      message: `O cliente ${customer.name} (${customer.email}) submeteu uma nova encomenda personalizada: ${order.productName} (${reference}).`,
      data: { orderId: order.id, customerId: customer.id },
    },
  })

  return NextResponse.json(order, { status: 201 })
}
