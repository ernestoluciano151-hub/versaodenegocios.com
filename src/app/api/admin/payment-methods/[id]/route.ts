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
    const { status, showInStore, sortOrder, description, configuration, name } = body

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(showInStore !== undefined && { showInStore }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(description !== undefined && { description }),
        ...(configuration !== undefined && { configuration }),
        ...(name !== undefined && { name }),
      },
    })

    return NextResponse.json(method)
  } catch (err) {
    console.error('PATCH /api/admin/payment-methods/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
