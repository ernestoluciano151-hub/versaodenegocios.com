import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payments'
import { sendOrderConfirmation, sendAdminNewOrder } from '@/lib/email'
import type { CartItem } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, street, city, province, country, notes, paymentMethod, items, totals, couponCode } = body

  if (!items?.length) return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 })

  // Validate stock
  for (const item of items as CartItem[]) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product || product.stock < item.quantity) {
      return NextResponse.json({ error: `Stock insuficiente para "${item.name}".` }, { status: 400 })
    }
  }

  // Find or create customer
  let customerId: string | undefined
  const existingCustomer = await prisma.customer.findUnique({ where: { email } })
  if (existingCustomer) {
    customerId = existingCustomer.id
  }

  // Validate coupon
  let couponDiscount = 0
  let couponId: string | undefined
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode, active: true } })
    if (coupon) {
      couponDiscount = coupon.type === 'percentage'
        ? (totals.subtotal * Number(coupon.value)) / 100
        : Number(coupon.value)
      couponId = coupon.id
    }
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      customerId,
      guestEmail: customerId ? undefined : email,
      guestName: customerId ? undefined : name,
      guestPhone: customerId ? undefined : phone,
      status: 'awaiting_confirmation',
      subtotal: totals.subtotal,
      discount: couponDiscount,
      shipping: totals.shipping,
      total: totals.total,
      notes,
      couponCode: couponCode ?? undefined,
      shippingAddress: { name, email, phone, street, city, province, country },
      items: {
        create: (items as CartItem[]).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          salePrice: item.salePrice ?? undefined,
          productSnapshot: { name: item.name, brand: item.brand, image: item.image, sku: item.productId },
        })),
      },
    },
  })

  // Process payment
  const provider = getPaymentProvider(paymentMethod)
  const paymentResult = await provider.createPayment({
    orderId: order.id,
    amount: totals.total,
    currency: 'AOA',
    customerName: name,
    customerEmail: email,
  })

  await prisma.payment.create({
    data: {
      orderId: order.id,
      customerId,
      paymentMethod,
      amount: totals.total,
      currency: 'AOA',
      transactionReference: paymentResult.transactionReference,
      paymentStatus: 'pending',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gatewayResponse: paymentResult.gatewayResponse as any,
    },
  })

  // Update stock
  for (const item of items as CartItem[]) {
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
      data: { totalSpent: { increment: totals.total }, ordersCount: { increment: 1 } },
    })
  }

  // Send emails (best-effort)
  try {
    await Promise.all([
      sendOrderConfirmation(email, {
        id: order.id,
        customerName: name,
        total: totals.total,
        items: (items as CartItem[]).map((i) => ({ name: i.name, quantity: i.quantity, price: i.salePrice ?? i.price })),
      }),
      sendAdminNewOrder({ orderId: order.id, customerName: name, total: totals.total }),
    ])
  } catch { /* email failure should not block order */ }

  return NextResponse.json({ orderId: order.id, transactionReference: paymentResult.transactionReference })
}
