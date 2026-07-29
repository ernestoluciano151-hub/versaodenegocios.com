import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {

  const config = await prisma.whatsAppConfig.findFirst()
  return NextResponse.json(config ?? {})
}

export async function POST(req: NextRequest) {

  const body = await req.json()
  const existing = await prisma.whatsAppConfig.findFirst()
  const config = existing
    ? await prisma.whatsAppConfig.update({ where: { id: existing.id }, data: body })
    : await prisma.whatsAppConfig.create({ data: body })
  return NextResponse.json(config)
}
