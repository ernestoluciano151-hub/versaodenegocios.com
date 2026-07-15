import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const requests = await prisma.approvalRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (err) {
    console.error('GET /api/admin/approval-requests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { type, targetId, targetType, targetLabel, requestedBy, requestedByName } = body

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type,
        targetId,
        targetType,
        targetLabel,
        requestedBy,
        requestedByName,
        status: 'pending',
      },
    })

    return NextResponse.json(approvalRequest, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/approval-requests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
