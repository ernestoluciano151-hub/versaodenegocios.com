import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimit(`newsletter:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas tentativas. Tente novamente em breve.' }, { status: 429 })
  }

  const { email, name } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const existing = await prisma.newsletter.findUnique({ where: { email } })
  if (existing) {
    if (!existing.active) {
      await prisma.newsletter.update({ where: { email }, data: { active: true, name: name || existing.name } })
      return NextResponse.json({ message: 'Subscrição reactivada!' })
    }
    return NextResponse.json({ message: 'Email já subscrito!' })
  }
  await prisma.newsletter.create({ data: { email, name: name || null, active: true } })
  return NextResponse.json({ message: 'Subscrito com sucesso!' }, { status: 201 })
}
