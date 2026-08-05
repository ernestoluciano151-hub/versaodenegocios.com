import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'vn_cart_sid'

type SyncItem = { productId: string; quantity: number; savedForLater?: boolean }

/**
 * POST /api/cart — sincroniza o carrinho local (Zustand/localStorage) com a
 * base de dados, para que o painel admin ("Carrinhos Abandonados") reflicta
 * o que o cliente tem realmente no carrinho na loja.
 *
 * Identifica o carrinho por customerId (se autenticado) ou por um cookie
 * de sessão de convidado (vn_cart_sid), definido aqui na primeira chamada.
 */
export async function POST(req: NextRequest) {
  let body: { items?: SyncItem[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const items = Array.isArray(body.items) ? body.items.filter(i => i?.productId && i.quantity > 0) : []

  const customer = await getCustomerSession(req)
  let sessionId = req.cookies.get(COOKIE_NAME)?.value ?? null
  let issueCookie = false
  if (!customer && !sessionId) {
    sessionId = randomUUID()
    issueCookie = true
  }

  try {
    const existing = await prisma.cart.findFirst({
      where: customer ? { customerId: customer.id } : { sessionId },
    })

    if (items.length === 0) {
      if (existing) await prisma.cartItem.deleteMany({ where: { cartId: existing.id } })
      const res = NextResponse.json({ success: true })
      if (issueCookie && sessionId) {
        res.cookies.set(COOKIE_NAME, sessionId, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
      }
      return res
    }

    const cart = existing
      ? await prisma.cart.update({
          where: { id: existing.id },
          data: {
            customerId: customer?.id ?? existing.customerId ?? null,
            sessionId: customer ? existing.sessionId : sessionId,
          },
        })
      : await prisma.cart.create({
          data: { customerId: customer?.id ?? null, sessionId: customer ? null : sessionId },
        })

    // Só mantemos produtos que ainda existem (evita FK crash se um produto foi eliminado)
    const validIds = new Set(
      (await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } }, select: { id: true } })).map(p => p.id)
    )

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cartItem.createMany({
        data: items
          .filter(i => validIds.has(i.productId))
          .map(i => ({ cartId: cart.id, productId: i.productId, quantity: i.quantity, savedForLater: !!i.savedForLater })),
      }),
    ])

    const res = NextResponse.json({ success: true })
    if (issueCookie && sessionId) {
      res.cookies.set(COOKIE_NAME, sessionId, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    }
    return res
  } catch (err) {
    console.error('[POST /api/cart]', err)
    return NextResponse.json({ error: 'Erro ao sincronizar carrinho' }, { status: 500 })
  }
}
