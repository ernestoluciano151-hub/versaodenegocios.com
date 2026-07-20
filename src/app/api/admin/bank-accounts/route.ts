import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const accounts = await prisma.bankAccount.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const body = await req.json()
  if (!body.bankName || !body.label || !body.holder) {
    return NextResponse.json({ error: 'bankName, label e holder são obrigatórios.' }, { status: 400 })
  }
  const account = await prisma.bankAccount.create({ data: body })
  return NextResponse.json(account, { status: 201 })
}
