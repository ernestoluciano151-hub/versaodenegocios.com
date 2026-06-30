import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// GET — get affiliate profile
export async function GET() {
  const session = await auth()
  const user = session?.user as { id?: string; type?: string } | undefined
  if (!session || user?.type !== 'customer') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { customerId: user.id! },
    include: {
      commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
      clicks: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  return NextResponse.json(affiliate ?? null)
}

// POST — apply to become an affiliate
export async function POST(_req: NextRequest) {
  const session = await auth()
  const user = session?.user as { id?: string; type?: string } | undefined
  if (!session || user?.type !== 'customer') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const existing = await prisma.affiliate.findUnique({ where: { customerId: user.id! } })
  if (existing) return NextResponse.json(existing)

  const customer = await prisma.customer.findUnique({ where: { id: user.id! } })
  if (!customer) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const code = customer.name.toLowerCase().replace(/\s+/g, '') + '-' + crypto.randomBytes(3).toString('hex')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://versaodenegocios.com'
  const link = `${baseUrl}?ref=${code}`

  const affiliate = await prisma.affiliate.create({
    data: {
      customerId: user.id!,
      code,
      link,
      status: 'pending',
    },
  })

  return NextResponse.json(affiliate)
}
