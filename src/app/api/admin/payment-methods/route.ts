import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const methods = await prisma.paymentMethod.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(methods)
  } catch (err) {
    console.error('GET /api/admin/payment-methods error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { id, ...data } = body

    let method
    if (id) {
      method = await prisma.paymentMethod.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      })
    } else {
      method = await prisma.paymentMethod.create({ data })
    }

    return NextResponse.json(method, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/payment-methods error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
