import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminUser } from '@/lib/admin-auth'

export async function GET(req: Request) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json([], { status: 200 })
  }
  try {
    // Agregar notificações reais do sistema
    const [pendingOrders, lowStockProducts, pendingTickets] = await Promise.all([
      prisma.order.count({ where: { status: 'awaiting_confirmation' } }),
      prisma.product.count({ where: { stock: { lte: 5 }, active: true } }),
      prisma.supportTicket.count({ where: { status: 'open' } }),
    ])

    const notifications = []
    const now = new Date().toISOString()

    if (pendingOrders > 0) {
      notifications.push({
        id: 'pending-orders',
        type: 'order',
        title: `${pendingOrders} pedido${pendingOrders > 1 ? 's' : ''} aguarda${pendingOrders === 1 ? '' : 'm'} confirmação`,
        message: 'Clique para gerir os pedidos pendentes',
        read: false,
        createdAt: now,
      })
    }
    if (lowStockProducts > 0) {
      notifications.push({
        id: 'low-stock',
        type: 'product',
        title: `${lowStockProducts} produto${lowStockProducts > 1 ? 's' : ''} com stock baixo`,
        message: 'Repor stock antes de ficarem esgotados',
        read: false,
        createdAt: now,
      })
    }
    if (pendingTickets > 0) {
      notifications.push({
        id: 'open-tickets',
        type: 'system',
        title: `${pendingTickets} ticket${pendingTickets > 1 ? 's' : ''} de suporte em aberto`,
        message: 'Responder aos clientes em espera',
        read: false,
        createdAt: now,
      })
    }

    return NextResponse.json(notifications)
  } catch {
    return NextResponse.json([])
  }
}
