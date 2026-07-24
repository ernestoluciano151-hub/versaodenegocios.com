import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, isSuperRole, type PermissionKey, type PermissionMap } from '@/lib/permissions'

/** Returns the admin session or a 401 NextResponse. Use in all /api/admin/* routes. */
export async function requireAdmin() {
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

/**
 * Verifica se o utilizador autenticado tem uma permissão específica.
 * SUPER_ADMIN e ADMIN têm bypass automático.
 *
 * Uso:
 *   const { error, session } = await requirePermission('canEditProducts')
 *   if (error) return error
 */
export async function requirePermission(permission: PermissionKey) {
  const session = await auth()

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
