import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { sendWhatsApp } from '@/lib/whatsapp'
import type { WhatsAppEvent } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {

  const { phone, event, vars, customerId } = await req.json()
  if (!phone || !event) return NextResponse.json({ error: 'phone e event são obrigatórios' }, { status: 400 })
  const result = await sendWhatsApp(event as WhatsAppEvent, phone, vars ?? {}, customerId)
  return NextResponse.json(result)
}
