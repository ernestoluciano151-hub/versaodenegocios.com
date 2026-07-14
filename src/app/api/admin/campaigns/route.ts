import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error


  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error


  const body = await req.json()
  const { name, subject, body: bodyText, scheduledAt, status } = body
  const campaign = await prisma.campaign.create({
    data: {
      name,
      subject,
      body: bodyText,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: status ?? 'draft',
    },
  })
  return NextResponse.json(campaign, { status: 201 })
}
