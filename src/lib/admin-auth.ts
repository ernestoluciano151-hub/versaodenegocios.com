import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/** Returns the admin session or a 401 NextResponse. Use in all /api/admin/* routes. */
export async function requireAdmin() {
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin') {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}
