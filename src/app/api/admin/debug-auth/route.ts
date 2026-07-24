/**
 * GET /api/admin/debug-auth?email=xxx
 * Endpoint de diagnóstico temporário — retorna estado do utilizador SEM expor dados sensíveis.
 * REMOVER após resolver o problema de login.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email param required' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        mustChangePassword: true,
        lastLoginAt: true,
        // Only first 20 chars of hash to identify type ($argon2id vs $2b$ bcrypt)
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        found: false,
        email,
        env: {
          hasPepper: !!process.env.PASSWORD_PEPPER,
          hasAuthSecret: !!process.env.AUTH_SECRET,
          nodeEnv: process.env.NODE_ENV,
        },
      })
    }

    const hashType = user.password?.startsWith('$argon2id')
      ? 'argon2id'
      : user.password?.startsWith('$2b$') || user.password?.startsWith('$2a$')
      ? 'bcrypt-legacy'
      : 'unknown'

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
        hashType,
        hashPrefix: user.password?.substring(0, 25) + '...',
      },
      env: {
        hasPepper: !!process.env.PASSWORD_PEPPER,
        hasAuthSecret: !!process.env.AUTH_SECRET || !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
