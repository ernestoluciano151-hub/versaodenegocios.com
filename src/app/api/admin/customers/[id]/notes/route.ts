import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session: adminUser } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  void adminUser

  const notes = await prisma.customerNote.findMany({
    where: { customerId: id },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(notes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session: adminUser } = await requireAdmin(req)
  if (error) return error

  const { id } = await params
  const body = await req.json()

  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'O conteúdo da nota é obrigatório.' }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
  }

  const note = await prisma.customerNote.create({
    data: {
      customerId: id,
      adminId: adminUser!.id,
      content: body.content.trim(),
    },
  })

  return NextResponse.json(note, { status: 201 })
}
