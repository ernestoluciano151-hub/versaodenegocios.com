import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const { status, approvedBy, approvedByName, comment } = body

    const approvalRequest = await prisma.approvalRequest.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(approvedBy !== undefined && { approvedBy }),
        ...(approvedByName !== undefined && { approvedByName }),
        ...(comment !== undefined && { comment }),
        ...(status && status !== 'pending' && { resolvedAt: new Date() }),
      },
    })

    return NextResponse.json(approvalRequest)
  } catch (err) {
    console.error('PATCH /api/admin/approval-requests/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
