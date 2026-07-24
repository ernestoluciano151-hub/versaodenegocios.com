/**
 * GET /api/admin/debug-auth?s=vndiag&email=xxx
 * Diagnóstico de auth — SEM guard de autenticação.
 * Testa 3 métodos de leitura de sessão. REMOVER após resolver o problema.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('s') !== 'vndiag') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const isProd = process.env.NODE_ENV === 'production'

  // ── Teste 1: auth() sem request (método antigo — confirmado broken) ─────────
  let t1: Record<string, unknown> = {}
  try {
    const s = await auth()
    const u = s?.user as { type?: string; role?: string; email?: string; id?: string } | null
    t1 = {
      hasSession: !!s,
      type: u?.type ?? null,
      role: u?.role ?? null,
      email: u?.email ?? null,
      wouldPassAdmin: u?.type === 'admin',
    }
  } catch (e) { t1 = { error: String(e) } }

  // ── Teste 2: auth(req) — comporta-se como middleware, não retorna Session ───
  let t2: Record<string, unknown> = {}
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (auth as any)(req as Request)
    t2 = {
      resultType: typeof result,
      resultValue: result === true ? 'true (authorized callback)' : String(result),
      isSession: typeof result === 'object' && result !== null && 'user' in result,
    }
  } catch (e) { t2 = { error: String(e) } }

  // ── Teste 3: getToken() — FIX PROPOSTO (lê JWT directamente dos cookies) ───
  let t3: Record<string, unknown> = {}
  try {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '',
      cookieName: isProd ? '__Secure-authjs.session-token' : 'authjs.session-token',
      secureCookie: isProd,
    })
    t3 = {
      hasToken: !!token,
      type: (token?.type as string) ?? null,
      role: (token?.role as string) ?? null,
      email: (token?.email as string) ?? null,
      id: (token?.id as string) ?? null,
      wouldPassAdmin: (token?.type as string) === 'admin',
      hasPermissions: !!token?.permissions,
    }
  } catch (e) { t3 = { error: String(e) } }

  // ── DB user (se email fornecido) ────────────────────────────────────────────
  const email = req.nextUrl.searchParams.get('email')
  let dbUser: Record<string, unknown> | null = null
  if (email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true, email: true, name: true, role: true,
          active: true, mustChangePassword: true, lastLoginAt: true, password: true,
        },
      })
      if (user) {
        dbUser = {
          ...user,
          hashType: user.password?.startsWith('$argon2id') ? 'argon2id'
            : user.password?.startsWith('$2b$') || user.password?.startsWith('$2a$') ? 'bcrypt'
            : 'unknown',
          hashPrefix: user.password?.substring(0, 25) + '…',
          password: undefined,
        }
      }
    } catch (e) { dbUser = { error: String(e) } }
  }

  // ── Inspecção de cookies recebidos no request ──────────────────────────────
  const cookieHeader = req.headers.get('cookie') ?? ''
  const cookieNames = cookieHeader
    .split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean)

  const expectedCookie = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token'
  const hasExpectedCookie = cookieNames.includes(expectedCookie)

  return NextResponse.json({
    test1_auth_no_req: t1,
    test2_auth_with_req: t2,
    test3_getToken: t3,
    cookies_diagnostic: {
      cookiesReceived: cookieNames,
      expectedCookieName: expectedCookie,
      hasExpectedCookie,
      requestUrl: req.url,
      requestHost: req.headers.get('host'),
      // Se hasExpectedCookie=false → não estás logado neste domínio/URL
      // Se hasExpectedCookie=true mas test3 falha → problema com secret/salt
    },
    env: {
      nodeEnv: isProd ? 'production' : 'development',
      hasPepper: !!process.env.PASSWORD_PEPPER,
      hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
      cookieName: expectedCookie,
    },
    dbUser,
  })
}
