import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'
import { sendOrderConfirmation, sendAdminNewOrder } from '@/lib/email'
import { awardPurchasePoints } from '@/lib/loyalty'
import { checkoutSchema } from '@/lib/validations'
import type { CartItem } from '@/types'

const SHIPPING_RATE = 500 // AOA — flat rate; adjust as needed

export async function POST(req: NextRequest) {
  const body = await req.json()

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }

  const { name, email, phone, street, city, province, country, notes, paymentMethod, couponCode } = parsed.data
  const { items } = body as { items: CartItem[] }

  if (!items?.length) return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 })

  // ── SERVER-SIDE PRICE & STOCK VERIFICATION ──────────────────────────────────
  const productIds = items.map((i) => i.productId)
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  })
  const productMap = Object.fromEntries(dbProducts.map((p) => [p.id, p]))

  let subtotal = 0
  for (const item of items) {
    const product = productMap[item.productId]
    if (!product) {
      return NextResponse.json({ error: `Produto não encontrado.` }, { status: 400 })
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Stock insuficiente para "${product.name}".` }, { status: 400 })
    }
    // Use server price — salePrice if set, else regular price
    const unitPrice = product.salePrice ? Number(product.salePrice) : Number(product.price)
    subtotal += unitPrice * item.quantity
  }

  const shipping = SHIPPING_RATE
  let discount = 0
  let couponId: string | undefined

  // Validate coupon server-side
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode, active: true } })
    if (coupon) {
      discount = coupon.type === 'percentage'
        ? Math.round((subtotal * Number(coupon.value)) / 100)
        : Number(coupon.value)
      couponId = coupon.id
    }
  }

  const total = Math.max(0, subtotal - discount + shipping)
  // ──────────────────────────────────────────────────────────────────────────────

  // Find customer
  let customerId: string | undefined
  const existingCustomer = await prisma.customer.findUnique({ where: { email } })
  if (existingCustomer) customerId = existingCustomer.id

  // Create order using server-computed totals
  const order = await prisma.order.create({
    data: {
      customerId,
      guestEmail: customerId ? undefined : email,
      guestName: customerId ? undefined : name,
      guestPhone: customerId ? undefined : phone,
      status: 'awaiting_confirmation',
      subtotal,
      discount,
      shipping,
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
            price: Number(product.price),
            salePrice: product.salePrice ? Number(product.salePrice) : undefined,
            productSnapshot: {
              name: product.name,
              brand: product.brand,
              image: (product.images as string[])?.[0] ?? null,
              sku: product.id,
            },
          }
        }),
      },
    },
  })

  // Process payment
  const provider = getPaymentProvider(paymentMethod)
  const paymentResult = await provider.createPayment({
    orderId: order.id,
    amount: total,
    currency: 'AOA',
    customerName: name,
    customerEmail: email,
  })

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

  // Update stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }

  // Update coupon usage
  if (couponId) {
    await Promise.all([
      prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }),
      prisma.couponUsage.create({ data: { couponId, orderId: order.id, customerId } }),
    ])
  }

  // Update customer stats
  if (customerId) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { totalSpent: { increment: total }, ordersCount: { increment: 1 } },
    })
  }

  // Award loyalty points (best-effort)
  if (customerId) {
    try { await awardPurchasePoints(customerId, total, order.id) } catch { /* non-blocking */ }
  }

  // Send emails (best-effort)
  try {
    await Promise.all([
      sendOrderConfirmation(email, {
        id: order.id,
        customerName: name,
        total,
        items: items.map((i) => {
          const p = productMap[i.productId]
          const price = p?.salePrice ? Number(p.salePrice) : Number(p?.price ?? i.price)
          return { name: p?.name ?? i.name, quantity: i.quantity, price }
        }),
      }),
      sendAdminNewOrder({ orderId: order.id, customerName: name, total }),
    ])
  } catch { /* email failure should not block order */ }

  return NextResponse.json({ orderId: order.id, transactionReference: paymentResult.transactionReference, total })
}
