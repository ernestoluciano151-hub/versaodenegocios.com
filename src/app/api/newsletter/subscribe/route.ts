import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
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
