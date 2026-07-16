import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`contact:${ip}`, 3, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas tentativas. Tente novamente em breve.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })

  const { name, email, subject, message } = body
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Nome, email e mensagem são obrigatórios.' }, { status: 400 })
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? 'info@versaodenegocios.com'
    await sendContactEmail(adminEmail, { name, email, subject, message })
  } catch (err) {
    logError(err, 'contacto:email')
    // Don't expose internal errors — still return success to avoid info leakage
  }

  return NextResponse.json({ ok: true })
}
