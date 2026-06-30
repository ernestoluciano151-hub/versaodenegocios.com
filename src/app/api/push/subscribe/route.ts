import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = session?.user as { id?: string; type?: string } | undefined
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
      customerId: user?.type === 'customer' ? (user.id ?? null) : null,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      customerId: user?.type === 'customer' ? (user.id ?? null) : null,
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
