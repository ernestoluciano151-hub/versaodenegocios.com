import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, isSuperRole, type PermissionKey, type PermissionMap } from '@/lib/permissions'

/**
 * Lê a sessão NextAuth de forma compatível com Next.js 15/16.
 *
 * Em Next.js 15+ os route handlers exigem que o request seja passado
 * explicitamente a auth() — `cookies()` de next/headers é assíncrono e
 * não está disponível da mesma forma dentro de route handlers.
 *
 * Passa sempre `req` nas route handlers:
 *   const { error } = await requireAdmin(req)
 */
async function getSession(req?: NextRequest) {
  if (req) {
    // Passa o request diretamente — padrão recomendado para Next.js 15/16 route handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (auth as unknown as (r: Request) => ReturnType<typeof auth>)(req as Request)
  }
  // Fallback para Server Components (sem request no contexto)
  return auth()
}

/** Verifica sessão admin. Sempre passar `req` nas route handlers. */
export async function requireAdmin(req?: NextRequest) {
  const session = await getSession(req)
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

/**
 * Verifica se o utilizador autenticado tem uma permissão específica.
 * SUPER_ADMIN e ADMIN têm bypass automático.
 *
 * Uso (sempre passar req):
 *   const { error, session } = await requirePermission('canEditProducts', req)
 *   if (error) return error
 */
export async function requirePermission(permission: PermissionKey, req?: NextRequest) {
  const session = await getSession(req)

  // Não é admin de todo
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), session: null }
  }

  const user = session!.user as { role?: string; permissions?: PermissionMap }
  const role = user.role ?? ''

  // Super admins têm acesso total
  if (isSuperRole(role)) {
    return { error: null, session }
  }

  // Verificar permissão no mapa carregado no JWT
  if (!hasPermission(user.permissions, permission)) {
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
