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
  if (body.country !== undefined) data.country = body.country
  if ('contact' in body) data.contact = body.contact || null
  if ('email' in body) data.email = body.email || null
  if ('phone' in body) data.phone = body.phone || null
  if ('website' in body) data.website = body.website || null
  if ('notes' in body) data.notes = body.notes || null
  if (body.active !== undefined) data.active = body.active
  const supplier = await prisma.supplier.update({ where: { id }, data })
  return NextResponse.json(supplier)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  await prisma.supplier.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
