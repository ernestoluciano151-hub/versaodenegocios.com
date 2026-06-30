import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendWhatsApp } from '@/lib/whatsapp'
import type { WhatsAppEvent } from '@/lib/whatsapp'

function isAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return session && (session.user as { type?: string })?.type === 'admin'
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { phone, event, vars, customerId } = await req.json()
  if (!phone || !event) return NextResponse.json({ error: 'phone e event são obrigatórios' }, { status: 400 })
  const result = await sendWhatsApp(event as WhatsAppEvent, phone, vars ?? {}, customerId)
  return NextResponse.json(result)
}
