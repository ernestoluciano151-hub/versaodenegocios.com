import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.category !== undefined) data.category = body.category
  if (body.description !== undefined) data.description = body.description
  if (body.amount !== undefined) data.amount = Number(body.amount)
  if (body.currency !== undefined) data.currency = body.currency
  if (body.date !== undefined) data.date = new Date(body.date)
  if ('supplierId' in body) data.supplierId = body.supplierId || null
  if ('notes' in body) data.receipt = body.notes || null
  const expense = await prisma.expense.update({
    where: { id },
    data,
    include: { supplier: { select: { name: true } } },
  })
  return NextResponse.json(expense)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
