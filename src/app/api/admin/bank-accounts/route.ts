import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const accounts = await prisma.bankAccount.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const body = await req.json()
  if (!body.bankName || !body.accountHolder) {
    return NextResponse.json({ error: 'bankName e accountHolder são obrigatórios.' }, { status: 400 })
  }
  const account = await prisma.bankAccount.create({
    data: {
      bankName: body.bankName,
      accountHolder: body.accountHolder,
      iban: body.iban || null,
      nib: body.nib || null,
      accountNumber: body.accountNumber || null,
      swift: body.swift || null,
      notes: body.notes || null,
      sortOrder: body.sortOrder ?? 0,
    },
  })
  return NextResponse.json(account, { status: 201 })
}
