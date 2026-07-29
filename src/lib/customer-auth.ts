/**
 * customer-auth.ts — Autenticação de clientes em route handlers
 *
 * USA getToken(req) em vez de auth() porque auth() sem req é não-fiável
 * em route handlers do Next.js 16 (funciona apenas em Server Components e Middleware).
 * A mesma abordagem usada em admin-auth.ts.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from './prisma'

export type CustomerSession = {
  id: string
  name: string
  email: string
  image?: string | null
  type: 'customer'
}

// ── Leitura de sessão via JWT (route handlers) ────────────────────────────────

async function readCustomerToken(req: NextRequest): Promise<CustomerSession | null> {
  const isProd = process.env.NODE_ENV === 'production'

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '',
    cookieName: isProd ? '__Secure-authjs.session-token' : 'authjs.session-token',
    secureCookie: isProd,
  })

  if (!token || (token.type as string) !== 'customer') return null

  return {
    id: ((token.id ?? token.sub) as string | undefined) ?? '',
    name: (token.name as string | undefined) ?? '',
    email: (token.email as string | undefined) ?? '',
    image: (token.picture as string | undefined) ?? null,
    type: 'customer',
  }
}

/**
 * Lê a sessão do cliente a partir do request.
 * Retorna null se não houver sessão ou se for um admin.
 */
export async function getCustomerSession(req: NextRequest): Promise<CustomerSession | null> {
  return readCustomerToken(req)
}

/**
 * Verifica sessão de cliente. Usar em todas as route handlers /conta/*.
 *
 *   const { error, customer } = await requireCustomer(req)
 *   if (error) return error
 */
export async function requireCustomer(req: NextRequest): Promise<{
  error: Response | null
  customer: CustomerSession | null
}> {
  const customer = await readCustomerToken(req)
  if (!customer) {
    return {
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
      customer: null,
    }
  }
  return { error: null, customer }
}

/**
 * @deprecated usar requireCustomer(req) em route handlers
 * Mantido para compatibilidade com Server Components.
 */
export async function requireCustomerSession(): Promise<CustomerSession> {
  throw new Error('requireCustomerSession() não pode ser usada em route handlers. Usar requireCustomer(req).')
}

// ── Helpers de DB (sem mudança) ───────────────────────────────────────────────

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      _count: { select: { orders: true, wishlists: true, notifications: true } },
    },
  })
}
