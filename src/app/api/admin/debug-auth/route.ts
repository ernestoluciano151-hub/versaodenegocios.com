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

  // ── Reset de emergência (protegido pelo secret + param reset=nova_password) ─
  const email = req.nextUrl.searchParams.get('email')
  const resetPassword = req.nextUrl.searchParams.get('reset')
  let resetResult: Record<string, unknown> | null = null

  if (email && resetPassword) {
    if (resetPassword.length < 8) {
      resetResult = { error: 'Password deve ter pelo menos 8 caracteres' }
    } else {
      try {
        const { hashPassword } = await import('@/lib/password')
        const hashed = await hashPassword(resetPassword)
        await prisma.user.update({
          where: { email },
          data: { password: hashed, mustChangePassword: false },
        })
        resetResult = { success: true, message: `Password de ${email} actualizada com sucesso` }
      } catch (e) {
        resetResult = { error: String(e) }
      }
    }
  }

  // ── DB user ──────────────────────────────────────────────────────────────────
  let dbUser: Record<string, unknown> | null = null
  let verifyResult: Record<string, unknown> | null = null

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

        // ── Verificação directa da password (bypassa rate limit) ──────────────
        const verifyPlain = req.nextUrl.searchParams.get('verify')
        if (verifyPlain && user.password) {
          try {
            const { verifyPassword } = await import('@/lib/password')
            const { valid, needsRehash } = await verifyPassword(verifyPlain, user.password)
            verifyResult = {
              passwordTested: verifyPlain,
              valid,
              needsRehash,
              conclusion: valid
                ? '✅ Password CORRECTA — problema pode ser rate limit ou cookie de sessão'
                : '❌ Password INCORRECTA — hash não coincide. Re-fazer reset.',
            }
          } catch (e) {
            verifyResult = { error: String(e) }
          }
        }
      }
    } catch (e) { dbUser = { error: String(e) } }
  }

  // ── Simulação completa do authorize (bypassa rate limit) ─────────────────────
  // Usa ?simulate=password para correr os mesmos passos que auth.ts faz no login
  let simulateResult: Record<string, unknown> | null = null
  const simulatePassword = req.nextUrl.searchParams.get('simulate')
  if (email && simulatePassword) {
    const steps: Record<string, unknown> = {}
    try {
      // Passo 1 — buscar user na DB
      const u = await prisma.user.findUnique({ where: { email } })
      steps.step1_userFound = !!u
      steps.step1_active = u?.active ?? null

      if (!u || !u.active) {
        steps.conclusion = '❌ Bloqueado em step1: user não encontrado ou inactivo'
      } else {
        // Passo 2 — verificar password
        const { verifyPassword } = await import('@/lib/password')
        const { valid } = await verifyPassword(simulatePassword, u.password)
        steps.step2_passwordValid = valid

        if (!valid) {
          steps.conclusion = '❌ Bloqueado em step2: password incorrecta'
        } else {
          // Passo 3 — carregar permissões
          try {
            const { loadRolePermissions } = await import('@/lib/permissions.server')
            const perms = await loadRolePermissions(u.role)
            steps.step3_permissionsLoaded = true
            steps.step3_permissionKeys = Object.keys(perms)
          } catch (e3) {
            steps.step3_permissionsLoaded = false
            steps.step3_error = String(e3)
          }

          // Passo 4 — verificar AUTH_URL / NEXTAUTH_URL
          steps.step4_AUTH_URL = process.env.AUTH_URL ?? '(não definido)'
          steps.step4_NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? '(não definido)'
          steps.step4_requestHost = req.headers.get('host')

          steps.conclusion = steps.step3_permissionsLoaded
            ? '✅ Todos os passos OK — login devia funcionar. Verificar AUTH_URL/NEXTAUTH_URL se ainda falhar.'
            : '❌ Bloqueado em step3: loadRolePermissions lançou erro'
        }
      }
    } catch (e) {
      steps.fatalError = String(e)
    }
    simulateResult = steps
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
    ...(resetResult ? { reset: resetResult } : {}),
    ...(verifyResult ? { verify: verifyResult } : {}),
    ...(simulateResult ? { simulate_authorize: simulateResult } : {}),
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
