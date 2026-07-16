import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'
import { sendOrderConfirmation, sendAdminNewOrder } from '@/lib/email'
import { awardPurchasePoints } from '@/lib/loyalty'
import { checkoutSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

// ---------------------------------------------------------------------------
// In-memory idempotency store (per serverless instance, 60 s TTL).
// For multi-instance production: replace with Upstash Redis / Vercel KV.
// ---------------------------------------------------------------------------
const idempotencyStore = new Map<string, string>() // key → orderId
setInterval(() => idempotencyStore.clear(), 60_000)

// Shipping cost (server-authoritative — never trust the client)
const SHIPPING_COST = 0

export async function POST(req: NextRequest) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`checkout:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas tentativas. Aguarde antes de tentar novamente.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 60_000) / 1000)) },
      },
    )
  }

  // ── Parse & validate body ─────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo do pedido inválido.' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    )
  }

  const {
    name, email, phone,
    street, city, province, country,
    notes, paymentMethod, couponCode,
    items, idempotencyKey,
  } = parsed.data

  // ── Idempotency check ─────────────────────────────────────────────────────
  if (idempotencyKey) {
    const existingOrderId = idempotencyStore.get(idempotencyKey)
    if (existingOrderId) {
      return NextResponse.json(
        { orderId: existingOrderId, duplicate: true },
        { status: 200 },
      )
    }
  }

  // ── Fetch products & calculate totals SERVER-SIDE ─────────────────────────
  const productIds = items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    select: { id: true, name: true, price: true, salePrice: true, stock: true },
  })

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  // Validate stock & build verified items
  for (const item of items) {
    const product = productMap[item.productId]
    if (!product) {
      return NextResponse.json(
        { error: `Produto não encontrado: "${item.productId}".` },
        { status: 400 },
      )
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${product.name}".` },
        { status: 400 },
      )
    }
  }

  // Server-authoritative subtotal (ignore client-supplied prices)
  let subtotal = 0
  for (const item of items) {
    const product = productMap[item.productId]
    const unitPrice = product.salePrice ? Number(product.salePrice) : Number(product.price)
    subtotal += unitPrice * item.quantity
  }

  // ── Validate coupon ───────────────────────────────────────────────────────
  let couponDiscount = 0
  let couponId: string | undefined
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode, active: true },
    })
    if (coupon) {
      couponDiscount =
        coupon.type === 'percentage'
          ? (subtotal * Number(coupon.value)) / 100
          : Number(coupon.value)
      couponId = coupon.id
    }
  }

  const total = Math.max(0, subtotal - couponDiscount + SHIPPING_COST)

  // ── Find existing customer ────────────────────────────────────────────────
  const existingCustomer = await prisma.customer.findUnique({ where: { email } })
  const customerId = existingCustomer?.id

  // ── Atomic transaction: order + stock + coupon ────────────────────────────
  let order: { id: string }
  try {
    order = await prisma.$transaction(async (tx) => {
      // 1. Re-check stock inside the transaction to prevent race conditions
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        })
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${productMap[item.productId]?.name ?? item.productId}".`)
        }
      }

      // 2. Create order with server-calculated totals
      const newOrder = await tx.order.create({
        data: {
          customerId,
          guestEmail: customerId ? undefined : email,
          guestName: customerId ? undefined : name,
          guestPhone: customerId ? undefined : phone,
          status: 'awaiting_confirmation',
          subtotal,
          discount: couponDiscount,
          shipping: SHIPPING_COST,
          total,
          notes,
          couponCode: couponCode ?? undefined,
          shippingAddress: { name, email, phone, street, city, province, country },
          items: {
            create: items.map((item) => {
              const product = productMap[item.productId]
              const unitPrice = product.salePrice ? Number(product.salePrice) : Number(product.price)
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: unitPrice,
                salePrice: product.salePrice ? Number(product.salePrice) : undefined,
                productSnapshot: {
                  name: product.name,
                  brand: item.brand ?? '',
                  image: item.image ?? '',
                  sku: item.productId,
                },
              }
            }),
          },
        },
      })

      // 3. Decrement stock atomically
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // 4. Update coupon usage atomically
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        })
        await tx.couponUsage.create({
          data: { couponId, orderId: newOrder.id, customerId },
        })
      }

      // 5. Update customer stats atomically
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: { increment: total },
            ordersCount: { increment: 1 },
          },
        })
      }

      return newOrder
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao processar pedido.'
    logError(err, 'checkout:transaction')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // ── Store idempotency key AFTER successful creation ───────────────────────
  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, order.id)
  }

  // ── Process payment (outside transaction — external call) ─────────────────
  const provider = getPaymentProvider(paymentMethod)
  let paymentResult: { transactionReference: string; gatewayResponse?: unknown; iframeUrl?: string }
  try {
    paymentResult = await provider.createPayment({
      orderId: order.id,
      amount: total,
      currency: 'AOA',
      customerName: name,
      customerEmail: email,
    })
  } catch (err) {
    logError(err, 'checkout:payment')
    // Order created but payment failed — mark as payment_failed
    await prisma.order.update({ where: { id: order.id }, data: { status: 'cancelled' } })
    return NextResponse.json({ error: 'Falha ao iniciar pagamento. Tente novamente.' }, { status: 502 })
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      customerId,
      paymentMethod,
      amount: total,
      currency: 'AOA',
      transactionReference: paymentResult.transactionReference,
      paymentStatus: 'pending',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gatewayResponse: paymentResult.gatewayResponse as any,
    },
  })

  // ── Loyalty points (best-effort) ──────────────────────────────────────────
  if (customerId) {
    try {
      await awardPurchasePoints(customerId, total, order.id)
    } catch { /* loyalty failure must not block the order */ }
  }

  // ── Emails (best-effort) ──────────────────────────────────────────────────
  try {
    await Promise.all([
      sendOrderConfirmation(email, {
        id: order.id,
        customerName: name,
        total,
        items: items.map((i) => {
          const p = productMap[i.productId]
          const unitPrice = p.salePrice ? Number(p.salePrice) : Number(p.price)
          return { name: p.name, quantity: i.quantity, price: unitPrice }
        }),
      }),
      sendAdminNewOrder({ orderId: order.id, customerName: name, total }),
    ])
  } catch { /* email failure must not block the order */ }

  return NextResponse.json({
    orderId: order.id,
    transactionReference: paymentResult.transactionReference,
    ...(paymentResult.iframeUrl ? { iframeUrl: paymentResult.iframeUrl } : {}),
  })
}
