import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { DEFAULT_TEMPLATES } from '@/lib/whatsapp'

function isAdmin(session: Awaited<ReturnType<typeof auth>>) {
  return session && (session.user as { type?: string })?.type === 'admin'
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const templates = await prisma.whatsAppTemplate.findMany({ orderBy: { event: 'asc' } })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()

  if (body.seed) {
    // Seed default templates
    for (const t of DEFAULT_TEMPLATES) {
      await prisma.whatsAppTemplate.upsert({
        where: { event: t.event },
        update: {},
        create: t,
      })
    }
    return NextResponse.json({ ok: true, count: DEFAULT_TEMPLATES.length })
  }

  const template = await prisma.whatsAppTemplate.upsert({
    where: { event: body.event },
    update: { title: body.title, body: body.body, active: body.active ?? true },
    create: { event: body.event, title: body.title, body: body.body, target: body.target ?? 'customer' },
  })
  return NextResponse.json(template)
}
