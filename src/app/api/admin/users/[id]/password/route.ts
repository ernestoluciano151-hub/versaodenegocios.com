import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { hashPassword } from '@/lib/password'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const { password, forceChange } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        ...(forceChange !== undefined && { mustChangePassword: forceChange }),
      },
      select: { id: true, email: true, mustChangePassword: true },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('POST /api/admin/users/[id]/password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
