import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint público — devolve apenas contas activas (sem dados sensíveis completos para o cliente ver no modal)
export async function GET() {
  const accounts = await prisma.bankAccount.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, bankName: true, label: true, holder: true, iban: true, nib: true, account: true, swift: true, notes: true },
  })
  return NextResponse.json(accounts, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
