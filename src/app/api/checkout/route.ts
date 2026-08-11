import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'
import { getCustomerSession } from '@/lib/customer-auth'
import { sendOrderConfirmation, sendAdminNewOrder } from '@/lib/email'
import { awardPurchasePoints } from '@/lib/loyalty'
import { createCommissionForOrder } from '@/lib/affiliate'
import { checkoutSchema } from '@/lib/validations'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

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
    mcxPhone, items, idempotencyKey,
  } = parsed.data

  // ── Método de pagamento tem de estar activo e visível (Configurações → Pagamentos) ──
  // Autoridade única: o que o admin configurar aqui é o que realmente vale —
  // a UI do checkout já esconde/desactiva estas opções, mas isto impede que
  // alguém contorne a UI e submeta directamente um método "Em Breve"/inactivo.
  const paymentMethodConfig = await prisma.paymentMethod.findUnique({
    where: { type: paymentMethod },
    select: { status: true, showInStore: true },
  }).catch(() => null)
  if (paymentMethodConfig && (paymentMethodConfig.status !== 'active' || !paymentMethodConfig.showInStore)) {
    return NextResponse.json(
      { error: 'Este método de pagamento não está disponível de momento. Escolha outro método.' },
      { status: 400 },
    )
  }

  // ── Idempotency check (DB-backed — works across all serverless instances) ──
  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { orderId: existing.id, duplicate: true },
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
      // Check expiry
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Este cupão expirou.' }, { status: 400 })
      }
      // Check usage limit
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Este cupão atingiu o limite de utilizações.' }, { status: 400 })
      }
      couponDiscount =
        coupon.type === 'percentage'
          ? (subtotal * Number(coupon.value)) / 100
          : Number(coupon.value)
      couponId = coupon.id
    } else {
      return NextResponse.json({ error: 'Cupão inválido ou inativo.' }, { status: 400 })
    }
  }

  const total = Math.max(0, subtotal - couponDiscount + SHIPPING_COST)

  // ── Find existing customer ────────────────────────────────────────────────
  // 1º: sessão iniciada (garante que o pedido aparece na conta do cliente,
  //     mesmo que digite outro email no formulário)
  // 2º: fallback por email digitado
  const loggedCustomer = await getCustomerSession(req).catch(() => null)
  const existingCustomer = loggedCustomer
    ? { id: loggedCustomer.id }
    : await prisma.customer.findUnique({ where: { email }, select: { id: true } })
  const customerId = existingCustomer?.id

  // O stock nunca é deduzido no checkout, seja qual for o método de pagamento
  // (Multicaixa Express, referência, transferência bancária ou cash on delivery).
  // Só é deduzido quando o admin confirma a ENTREGA (ver PATCH /api/orders/[id]),
  // para que o stock disponível na loja reflicta sempre o stock físico real e
  // não fique "reservado" por pedidos pagos mas ainda não expedidos/cancelados.
  const deductStockNow = false

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
          idempotencyKey: idempotencyKey ?? undefined,
          stockDeducted: deductStockNow,
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
      //    (deductStockNow é sempre false — mantido por segurança/clareza,
      //    a dedução real acontece só na entrega, ver PATCH /api/orders/[id])
      if (deductStockNow) {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'out',
              quantity: item.quantity,
              reference: `Pedido #${newOrder.id.slice(-8).toUpperCase()}`,
              notes: 'Saída automática — checkout',
            },
          })
        }
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

  // ── Process payment (outside transaction — external call) ─────────────────
  let provider: ReturnType<typeof getPaymentProvider>
  try {
    provider = getPaymentProvider(paymentMethod)
  } catch {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'cancelled' } })
    return NextResponse.json(
      { error: 'Este método de pagamento não está disponível de momento. Escolha outro método.' },
      { status: 400 },
    )
  }
  let paymentResult: { transactionReference: string; gatewayResponse?: unknown; iframeUrl?: string }
  try {
    paymentResult = await provider.createPayment({
      orderId: order.id,
      amount: total,
      currency: 'AOA',
      customerName: name,
      customerEmail: email,
      metadata: mcxPhone ? { phoneNumber: mcxPhone } : undefined,
    })
  } catch (err) {
    logError(err, 'checkout:payment')
    // Order created but payment failed — mark as payment_failed
    await prisma.order.update({ where: { id: order.id }, data: { status: 'cancelled' } })
    const msg = err instanceof Error && err.message.includes('Multicaixa')
      ? err.message
      : 'Falha ao iniciar pagamento. Tente novamente.'
    return NextResponse.json({ error: msg }, { status: 502 })
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

  // ── Comissão de afiliado (best-effort) ────────────────────────────────────
  try {
    await createCommissionForOrder(req, { orderId: order.id, customerId, total })
  } catch (err) { logError(err, 'checkout:affiliate-commission') }

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

  // Dados de referência Multicaixa (método 'reference')
  const gw = paymentResult.gatewayResponse as
    | { entity?: string | null; reference?: string | null; expiresAt?: string | null }
    | undefined

  return NextResponse.json({
    orderId: order.id,
    transactionReference: paymentResult.transactionReference,
    ...(paymentResult.iframeUrl ? { iframeUrl: paymentResult.iframeUrl } : {}),
    // MCX Express via AppyPay: o cliente tem de aprovar o push na app
    ...(paymentMethod === 'multicaixa_express' ? { awaitApproval: true } : {}),
    // Referência Multicaixa: mostrar entidade + referência ao cliente
    ...(paymentMethod === 'reference'
      ? {
          paymentReference: {
            entity: gw?.entity ?? null,
            reference: gw?.reference ?? null,
            expiresAt: gw?.expiresAt ?? null,
            amount: total,
          },
        }
      : {}),
  })
}
