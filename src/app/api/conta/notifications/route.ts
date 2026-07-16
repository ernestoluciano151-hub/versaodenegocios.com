import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

const TYPE_GROUPS: Record<string, string[]> = {
  pedidos: ['order', 'order_created', 'order_confirmed', 'order_shipped', 'order_delivered'],
  pagamentos: ['payment', 'payment_confirmed', 'payment_failed'],
  facturas: ['invoice', 'invoice_issued'],
  reservas: ['reservation', 'reservation_confirmed', 'reservation_cancelled'],
  crm: ['crm', 'customer', 'new_customer', 'loyalty', 'fidelizacao'],
  afiliados: ['affiliate', 'affiliate_commission', 'affiliate_payout'],
  encomendas: ['custom_order', 'custom_order_message', 'custom_order_status', 'custom_order_customer_message', 'new_custom_order'],
  sistema: ['system', 'news', 'promotion', 'info', 'alert'],
}

export async function GET(req: NextRequest) {
  let customer
  try { customer = await requireCustomerSession() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { searchParams } = req.nextUrl
  const filter = searchParams.get('filter') ?? 'todas'
  const search = searchParams.get('search')?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { customerId: customer.id }

  if (filter === 'nao_lidas') where.read = false
  else if (filter === 'lidas') where.read = true
  else if (TYPE_GROUPS[filter]) where.type = { in: TYPE_GROUPS[filter] }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const unreadCount = await prisma.notification.count({
    where: { customerId: customer.id, read: false },
  })

  return NextResponse.json({
    notifications,
    unreadCount,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    },
  })
}

export async function PATCH(req: NextRequest) {
  let customer
  try { customer = await requireCustomerSession() } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const result = await prisma.notification.updateMany({
    where: { customerId: customer.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
