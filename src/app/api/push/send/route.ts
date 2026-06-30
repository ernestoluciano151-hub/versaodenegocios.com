import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return session && (session.user as { type?: string })?.type === 'admin'
}

// Simple push without web-push library (raw fetch to push endpoint)
async function sendPush(endpoint: string, p256dh: string, auth: string, payload: object) {
  // For full implementation, install web-push package and use sendNotification()
  // Here we store the payload and log — real sending requires VAPID keys
  console.log('[Push] Would send to:', endpoint.slice(0, 50), '...', JSON.stringify(payload))
  return { success: true }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { customerId, title, body, url, broadcast } = await req.json()

  let subscriptions = []
  if (broadcast) {
    subscriptions = await prisma.pushSubscription.findMany()
  } else if (customerId) {
    subscriptions = await prisma.pushSubscription.findMany({ where: { customerId } })
  } else {
    return NextResponse.json({ error: 'customerId ou broadcast requerido' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPush(sub.endpoint, sub.p256dh, sub.auth, { title, body, url }))
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, sent, total: subscriptions.length })
}
