import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error


  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    take: 50,
    include: { supplier: { select: { name: true } } },
  })
  return NextResponse.json(expenses)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error


  const body = await req.json()
  const { category, description, amount, currency, date, supplierId, notes } = body
  const expense = await prisma.expense.create({
    data: {
      category,
      description,
      amount: Number(amount),
      currency: currency ?? 'AOA',
      date: new Date(date),
      supplierId: supplierId || null,
      receipt: notes || null,
    },
    include: { supplier: { select: { name: true } } },
  })
  return NextResponse.json(expense, { status: 201 })
}
