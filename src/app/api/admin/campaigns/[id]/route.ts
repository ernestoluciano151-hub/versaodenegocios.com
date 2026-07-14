import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.subject !== undefined) data.subject = body.subject
  if (body.body !== undefined) data.body = body.body
  if (body.status !== undefined) data.status = body.status
  if ('scheduledAt' in body) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
  if (body.sentAt !== undefined) data.sentAt = body.sentAt ? new Date(body.sentAt) : null
  const campaign = await prisma.campaign.update({ where: { id }, data })
  return NextResponse.json(campaign)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.campaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
