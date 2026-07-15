import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

const SINGLETON_ID = 'singleton'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const settings = await prisma.emailSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID, provider: 'resend', fromName: 'VN Commerce' },
    })
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const settings = await prisma.emailSettings.upsert({
      where: { id: SINGLETON_ID },
      update: body,
      create: { id: SINGLETON_ID, ...body },
    })
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { action, apiKey, toEmail } = await req.json()
    if (action !== 'test') {
      return NextResponse.json({ error: 'Acção inválida' }, { status: 400 })
    }
    const settings = await prisma.emailSettings.findUnique({ where: { id: SINGLETON_ID } })
    const key = apiKey ?? settings?.apiKey
    if (!key) return NextResponse.json({ error: 'API Key não configurada' }, { status: 400 })
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const from = settings?.fromEmail ?? 'onboarding@resend.dev'
    const fromName = settings?.fromName ?? 'VN Commerce'
    const to = toEmail ?? settings?.supportEmail ?? settings?.fromEmail
    if (!to) return NextResponse.json({ error: 'Email de destino não configurado' }, { status: 400 })
    await resend.emails.send({
      from: `${fromName} <${from}>`,
      to,
      subject: 'Teste de Email — VN Commerce',
      html: '<p>Se recebeste este email, as configurações estão a funcionar! ✅</p>',
    })
    return NextResponse.json({ ok: true, message: 'Email de teste enviado com sucesso.' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Falha ao enviar email de teste' }, { status: 500 })
  }
}
