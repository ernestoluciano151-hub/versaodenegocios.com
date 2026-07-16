import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if ((session?.user as { type?: string })?.type !== 'admin')
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const leads = await prisma.lead.findMany({
    include: {
      customer: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(leads)
}
