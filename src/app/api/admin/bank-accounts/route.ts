import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(accounts)
  } catch (err) {
    console.error('GET /api/admin/bank-accounts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const account = await prisma.bankAccount.create({ data: body })
    return NextResponse.json(account, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/bank-accounts error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
