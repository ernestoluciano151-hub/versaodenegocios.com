import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'
import { rateLimit } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vn-tech-store.vercel.app'
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rl = rateLimit(`forgot-pw:${ip}`, 3, 15 * 60_000) // 3 attempts per 15 min
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas tentativas. Tente novamente mais tarde.' }, { status: 429 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const customer = await prisma.customer.findUnique({ where: { email } })

  // Always return success to avoid email enumeration
  if (!customer || !customer.active) {
    return NextResponse.json({ message: 'Se este email existir, receberá um link de recuperação.' })
  }

  // Invalidate old tokens
  await prisma.passwordResetToken.updateMany({
    where: { customerId: customer.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  // Create new token (expires in 1 hour)
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { token, customerId: customer.id, expiresAt },
  })

  const resetUrl = `${SITE_URL}/conta/redefinir-password?token=${token}`

  await resend.emails.send({
    from: `VN Commerce <${FROM}>`,
    to: email,
    subject: 'Recuperação de palavra-passe — VN Commerce',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#111">Recuperar palavra-passe</h2>
        <p>Olá, <strong>${customer.name}</strong>!</p>
        <p>Recebemos um pedido para recuperar a palavra-passe da sua conta.</p>
        <p>Clique no botão abaixo para definir uma nova palavra-passe. O link é válido durante <strong>1 hora</strong>.</p>
        <a href="${resetUrl}"
          style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Redefinir palavra-passe
        </a>
        <p style="color:#666;font-size:13px">Se não pediu a recuperação, pode ignorar este email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">VN Commerce — Produtos Eletrónicos</p>
      </div>
    `,
  })

  return NextResponse.json({ message: 'Se este email existir, receberá um link de recuperação.' })
}
