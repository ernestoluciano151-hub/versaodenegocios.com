import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { auth } from '@/lib/auth'
import { hasPermission, isSuperRole, type PermissionKey, type PermissionMap } from '@/lib/permissions'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type AdminSession = {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    type: string
    role: string
    permissions: PermissionMap
  }
  expires: string
}

// ── Leitura de sessão ─────────────────────────────────────────────────────────

/**
 * Lê a sessão JWT a partir do request.
 *
 * PORQUÊ getToken e não auth():
 *   - auth() sem parâmetros não funciona em route handlers no Next.js 15/16
 *     (funciona apenas em Server Components e Middleware).
 *   - auth(req) comporta-se como middleware (corre o callback `authorized`
 *     e retorna true/Response), não retorna a Session.
 *   - getToken() de next-auth/jwt lê e descodifica o JWT directamente
 *     dos cookies do request — funciona em qualquer contexto.
 */
async function readSession(req?: NextRequest): Promise<AdminSession | null> {
  // ── Route handler: lê JWT directamente dos cookies ──────────────────────────
  if (req) {
    const isProd = process.env.NODE_ENV === 'production'

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '',
      // Nomes dos cookies definidos em auth.config.ts (coincidem com os defaults do Auth.js v5)
      cookieName: isProd ? '__Secure-authjs.session-token' : 'authjs.session-token',
      secureCookie: isProd,
    })

    if (!token) return null

    return {
      user: {
        id: ((token.id ?? token.sub) as string | undefined) ?? '',
        name: (token.name as string | undefined) ?? null,
        email: (token.email as string | undefined) ?? null,
        image: (token.picture as string | undefined) ?? null,
        type: (token.type as string | undefined) ?? '',
        role: (token.role as string | undefined) ?? '',
        permissions: (token.permissions as PermissionMap | undefined) ?? {},
      },
      expires: new Date(((token.exp as number | undefined) ?? 0) * 1000).toISOString(),
    }
  }

  // ── Server Component / fallback: usa auth() normalmente ────────────────────
  const session = await auth()
  if (!session) return null

  const u = session.user as {
    id?: string; name?: string; email?: string; image?: string
    type?: string; role?: string; permissions?: PermissionMap
  }

  return {
    user: {
      id: u.id ?? '',
      name: u.name ?? null,
      email: u.email ?? null,
      image: u.image ?? null,
      type: u.type ?? '',
      role: u.role ?? '',
      permissions: u.permissions ?? {},
    },
    expires: (session as { expires?: string }).expires ?? '',
  }
}

// ── Funções exportadas ────────────────────────────────────────────────────────

/**
 * Verifica sessão admin. Sempre passar `req` nas route handlers.
 *
 *   const { error, session } = await requireAdmin(req)
 *   if (error) return error
 */
export async function requireAdmin(req?: NextRequest) {
  const session = await readSession(req)

  if (session?.user.type !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
      session: null,
    }
  }

  return { error: null, session }
}

/**
 * Verifica permissão específica. SUPER_ADMIN e ADMIN têm bypass automático.
 *
 *   const { error, session } = await requirePermission('canEditProducts', req)
 *   if (error) return error
 */
export async function requirePermission(permission: PermissionKey, req?: NextRequest) {
  const session = await readSession(req)

  if (session?.user.type !== 'admin') {
    return {
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
      session: null,
    }
  }

  const { role, permissions } = session.user

  // Super admins têm acesso total — sem verificação de permissões
  if (isSuperRole(role)) {
    return { error: null, session }
  }

  if (!hasPermission(permissions, permission)) {
    return {
      error: NextResponse.json(
        { error: `Sem permissão: ${permission}` },
        { status: 403 }
      ),
      session: null,
    }
  }

  return { error: null, session }
}
