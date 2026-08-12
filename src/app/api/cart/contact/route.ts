import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

const COOKIE_NAME = 'vn_cart_sid'

/**
 * PATCH /api/cart/contact — regista o nome/email/telefone que o cliente vai
 * preenchendo no checkout, mesmo que não conclua a compra. Sem isto, um
 * carrinho abandonado por um visitante não autenticado ficava para sempre
 * como "Visitante anónimo" no admin, sem qualquer forma de follow-up.
 *
 * Best-effort: chamado com debounce a partir da página de checkout,
 * nunca deve bloquear nem mostrar erro ao cliente.
 */
export async function PATCH(req: NextRequest) {
  let body: { name?: string; email?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : ''
  if (!name && !email && !phone) return NextResponse.json({ ok: true })

  const customer = await getCustomerSession(req).catch(() => null)
  // Cliente autenticado já tem nome/email/telefone na própria conta — nada a fazer
  if (customer) return NextResponse.json({ ok: true })

  const sessionId = req.cookies.get(COOKIE_NAME)?.value ?? null
  if (!sessionId) return NextResponse.json({ ok: true })

  try {
    const existing = await prisma.cart.findFirst({ where: { sessionId } })
    if (!existing) return NextResponse.json({ ok: true }) // sem carrinho ainda sincronizado — nada a guardar

    await prisma.cart.update({
      where: { id: existing.id },
      data: {
        ...(name ? { guestName: name } : {}),
        ...(email ? { guestEmail: email } : {}),
        ...(phone ? { guestPhone: phone } : {}),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/cart/contact]', err)
    return NextResponse.json({ ok: false })
  }
}
