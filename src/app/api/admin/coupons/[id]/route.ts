import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.code !== undefined) data.code = String(body.code).toUpperCase()
  if (body.type !== undefined) data.type = body.type
  if (body.value !== undefined) data.value = Number(body.value)
  if ('minOrder' in body) data.minOrder = body.minOrder != null && body.minOrder !== '' ? Number(body.minOrder) : null
  if ('maxUses' in body) data.maxUses = body.maxUses != null && body.maxUses !== '' ? Number(body.maxUses) : null
  if ('expiresAt' in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  if (body.active !== undefined) data.active = body.active
  const coupon = await prisma.coupon.update({ where: { id }, data })
  return NextResponse.json(coupon)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
