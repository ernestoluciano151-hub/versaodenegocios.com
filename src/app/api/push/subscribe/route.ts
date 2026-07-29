import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { getCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Rate limit: 10 subscriptions per IP per hour
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`push-subscribe:${ip}`, 10, 60 * 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas tentativas. Aguarde antes de tentar novamente.' }, { status: 429 })
  }

  const customer = await getCustomerSession(req).catch(() => null)
  const body = await req.json()

  const { endpoint, keys } = body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Dados de subscrição inválidos' }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      customerId: customer?.id ?? null,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      customerId: customer?.id ?? null,
      userAgent: req.headers.get('user-agent') ?? undefined,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } })
  return NextResponse.json({ ok: true })
}
