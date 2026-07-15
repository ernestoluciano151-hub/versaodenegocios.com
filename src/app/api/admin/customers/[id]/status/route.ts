import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, reason, until, active } = body

  let data: Record<string, unknown> = {}

  if (action === 'suspend') {
    data = {
      suspendedAt: new Date(),
      suspendReason: reason ?? null,
      active: false,
    }
  } else if (action === 'unsuspend') {
    data = {
      suspendedAt: null,
      suspendReason: null,
      active: true,
    }
  } else if (action === 'ban') {
    data = {
      bannedAt: new Date(),
      banReason: reason ?? null,
      active: false,
    }
  } else if (action === 'unban') {
    data = {
      bannedAt: null,
      banReason: null,
      active: true,
    }
  } else if (action === 'block_login') {
    data = {
      loginBlockedUntil: until ? new Date(until) : new Date(Date.now() + 86400000),
    }
  } else if (action === 'unblock_login') {
    data = {
      loginBlockedUntil: null,
    }
  } else if (typeof active === 'boolean') {
    // Retrocompatibilidade
    data = { active }
  } else {
    return NextResponse.json(
      { error: 'Acção inválida. Use: suspend, unsuspend, ban, unban, block_login, unblock_login ou active.' },
      { status: 400 }
    )
  }

  const customer = await prisma.customer.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      suspendedAt: true,
      suspendReason: true,
      bannedAt: true,
      banReason: true,
      loginBlockedUntil: true,
    },
  })

  return NextResponse.json(customer)
}
