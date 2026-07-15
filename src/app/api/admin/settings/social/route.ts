import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

const SINGLETON_ID = 'singleton'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const settings = await prisma.socialSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID, ...{} },
    })
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const settings = await prisma.socialSettings.upsert({
      where: { id: SINGLETON_ID },
      update: body,
      create: { id: SINGLETON_ID, ...body },
    })
    return NextResponse.json(settings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
