import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const user = session?.user as { type?: string } | undefined
  if (!session || user?.type !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Campanha já enviada' }, { status: 400 })

  // Get active subscribers
  const subscribers = await prisma.newsletter.findMany({ where: { active: true } })
  if (subscribers.length === 0) {
    return NextResponse.json({ error: 'Sem subscritores activos' }, { status: 400 })
  }

  // Send in batches of 50 (Resend batch limit)
  const batchSize = 50
  let sent = 0
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    await resend.batch.send(
      batch.map(sub => ({
        from: `VN Tech <${FROM}>`,
        to: sub.email,
        subject: campaign.subject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            ${campaign.body}
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
            <p style="color:#999;font-size:11px;text-align:center">
              Recebeu este email porque subscreveu a newsletter da VN Tech.
            </p>
          </div>
        `,
      }))
    )
    sent += batch.length
  }

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: 'sent', sentAt: new Date(), recipientCount: sent },
  })

  return NextResponse.json({ ok: true, sent, campaign: updated })
}
