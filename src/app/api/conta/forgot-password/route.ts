import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { logError } from '@/lib/logger'
import crypto from 'crypto'
import { rateLimit } from '@/lib/rate-limit'

const SITE_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vn-tech-store.vercel.app'

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

  try {
    await sendPasswordResetEmail(email, { customerName: customer.name, resetUrl })
  } catch (err) {
    // A resposta mantém-se genérica (evita enumeração de emails), mas a
    // falha de envio fica registada nos logs para diagnóstico.
    logError(err, 'forgot-password:send-email')
  }

  return NextResponse.json({ message: 'Se este email existir, receberá um link de recuperação.' })
}
