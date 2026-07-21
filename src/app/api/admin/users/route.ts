import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { hashPassword } from '@/lib/password'

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  department: true,
  avatar: true,
  active: true,
  mustChangePassword: true,
  lastLoginAt: true,
  lastLoginIp: true,
  createdAt: true,
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { name, email, password, role, department, active } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
        active: active ?? true,
      },
      select: userSelect,
    })

    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
