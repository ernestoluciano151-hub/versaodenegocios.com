import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const requests = await prisma.approvalRequest.findMany({
      where: status ? { status } : undefined,
      take: 50,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (err) {
    console.error('GET /api/admin/approval-requests error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error

  try {
    const body = await req.json()
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
