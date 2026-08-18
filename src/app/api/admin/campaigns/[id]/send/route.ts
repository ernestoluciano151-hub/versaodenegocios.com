import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { logError } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Campanha já enviada' }, { status: 400 })

  // Get active subscribers
  const subscribers = await prisma.newsletter.findMany({ where: { active: true } })
  if (subscribers.length === 0) {
    return NextResponse.json({ error: 'Sem subscritores activos' }, { status: 400 })
  }

  // Configuração de email vem de Configurações → Email (BD), com fallback
  // para as variáveis de ambiente — mesma fonte usada pelo resto do site,
  // em vez de ler sempre e só a variável de ambiente.
  const settings = await prisma.emailSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null)
  const apiKey = settings?.apiKey || process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Serviço de email não configurado (Configurações → Email).' }, { status: 400 })
  }
  const fromEmail = settings?.fromEmail || process.env.EMAIL_FROM || 'onboarding@resend.dev'
  const fromName = settings?.fromName || 'VN Commerce'
  const resend = new Resend(apiKey)
  const FROM = `${fromName} <${fromEmail}>`

  // Send in batches of 50 (Resend batch limit)
  const batchSize = 50
  let sent = 0
  let failedBatches = 0
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    const { error: batchError } = await resend.batch.send(
      batch.map(sub => ({
        from: FROM,
        to: sub.email,
        subject: campaign.subject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            ${campaign.body}
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
            <p style="color:#999;font-size:11px;text-align:center">
              Recebeu este email porque subscreveu a newsletter da VN Commerce.
            </p>
          </div>
        `,
      }))
    )
    if (batchError) {
      failedBatches++
      logError(new Error(`${batchError.name}: ${batchError.message}`), 'campaigns:send-batch-failed')
    } else {
      sent += batch.length
    }
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: 'sent', sentAt: new Date(), recipientCount: sent },
  })

  if (failedBatches > 0) {
    return NextResponse.json({
      ok: sent > 0,
      sent,
      failedBatches,
      warning: `${failedBatches} lote(s) falharam ao enviar — ver logs para detalhes.`,
      campaign: updated,
    })
  }

  return NextResponse.json({ ok: true, sent, campaign: updated })
}
