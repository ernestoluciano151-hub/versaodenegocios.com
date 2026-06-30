import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — track an event (public, no auth required)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const user = session?.user as { id?: string; type?: string } | undefined
    const body = await req.json()

    await prisma.analyticsEvent.create({
      data: {
        type: body.type,
        customerId: user?.type === 'customer' ? (user.id ?? null) : null,
        sessionId: body.sessionId ?? null,
        productId: body.productId ?? null,
        orderId: body.orderId ?? null,
        page: body.page ?? null,
        referrer: body.referrer ?? null,
        metadata: body.metadata ?? undefined,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
        userAgent: req.headers.get('user-agent') ?? null,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

// GET — analytics data for admin dashboard
export async function GET(req: NextRequest) {
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '7d'
  const now = new Date()
  const from = new Date()
  if (period === '1d') from.setDate(now.getDate() - 1)
  else if (period === '7d') from.setDate(now.getDate() - 7)
  else if (period === '30d') from.setDate(now.getDate() - 30)
  else if (period === '90d') from.setDate(now.getDate() - 90)

  const [
    pageViews,
    productViews,
    addToCart,
    checkoutStarted,
    ordersCompleted,
    totalOrders,
    totalRevenue,
    newCustomers,
    topProducts,
    funnelData,
    eventsByDay,
  ] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: 'page_view', createdAt: { gte: from } } }),
    prisma.analyticsEvent.count({ where: { type: 'product_view', createdAt: { gte: from } } }),
    prisma.analyticsEvent.count({ where: { type: 'add_to_cart', createdAt: { gte: from } } }),
    prisma.analyticsEvent.count({ where: { type: 'checkout_started', createdAt: { gte: from } } }),
    prisma.analyticsEvent.count({ where: { type: 'order_completed', createdAt: { gte: from } } }),
    prisma.order.count({ where: { createdAt: { gte: from } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: from } }, _sum: { total: true } }),
    prisma.customer.count({ where: { createdAt: { gte: from } } }),
    // Top products by order items
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
      where: { order: { createdAt: { gte: from } } },
    }),
    // Funnel
    Promise.all([
      prisma.analyticsEvent.count({ where: { type: 'page_view', createdAt: { gte: from } } }),
      prisma.analyticsEvent.count({ where: { type: 'product_view', createdAt: { gte: from } } }),
      prisma.analyticsEvent.count({ where: { type: 'add_to_cart', createdAt: { gte: from } } }),
      prisma.analyticsEvent.count({ where: { type: 'checkout_started', createdAt: { gte: from } } }),
      prisma.analyticsEvent.count({ where: { type: 'order_completed', createdAt: { gte: from } } }),
    ]),
    // Events per day (last 7 days)
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, type, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ${from}
      GROUP BY DATE(created_at), type
      ORDER BY date ASC
    `,
  ])

  // Get product names for top products
  const productIds = topProducts.map((p) => p.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, images: true },
  })
  const topProductsWithNames = topProducts.map((p) => ({
    ...p,
    product: products.find((pr) => pr.id === p.productId),
  }))

  const avgTicket = totalOrders > 0 ? Number(totalRevenue._sum.total ?? 0) / totalOrders : 0

  const [fv, fpv, fatc, fcs, foc] = funnelData
  const funnelSteps = [
    { name: 'Visitas', count: fv, pct: 100 },
    { name: 'Produto Visto', count: fpv, pct: fv ? Math.round((fpv / fv) * 100) : 0 },
    { name: 'Adicionado Carrinho', count: fatc, pct: fpv ? Math.round((fatc / fpv) * 100) : 0 },
    { name: 'Checkout Iniciado', count: fcs, pct: fatc ? Math.round((fcs / fatc) * 100) : 0 },
    { name: 'Compra Concluída', count: foc, pct: fcs ? Math.round((foc / fcs) * 100) : 0 },
  ]

  return NextResponse.json({
    period,
    kpis: {
      pageViews,
      productViews,
      addToCart,
      checkoutStarted,
      ordersCompleted,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.total ?? 0),
      newCustomers,
      avgTicket,
      conversionRate: pageViews > 0 ? ((ordersCompleted / pageViews) * 100).toFixed(2) : '0',
    },
    funnel: funnelSteps,
    topProducts: topProductsWithNames,
    eventsByDay,
  })
}
