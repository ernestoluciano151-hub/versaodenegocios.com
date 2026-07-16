import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const permissions = await prisma.rolePermission.findMany({ take: 50 })
    return NextResponse.json(permissions)
  } catch (err) {
    console.error('GET /api/admin/role-permissions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { role, permissions } = body

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const rolePermission = await prisma.rolePermission.upsert({
      where: { role },
      update: { permissions },
      create: { role, permissions },
    })

    return NextResponse.json(rolePermission)
  } catch (err) {
    console.error('POST /api/admin/role-permissions error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
