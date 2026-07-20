import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const account = await prisma.bankAccount.update({ where: { id }, data: body })
  return NextResponse.json(account)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const { id } = await params
  await prisma.bankAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
