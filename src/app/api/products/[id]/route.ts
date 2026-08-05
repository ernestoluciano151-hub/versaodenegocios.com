import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!product) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(product)
}

// Mantém `active` e `visibility` sincronizados quando o form de edição
// (ProductEditForm) altera apenas o interruptor "Activo" sem tocar na
// visibilidade — evita o produto ficar preso num estado inconsistente
// (ex.: active=true mas visibility='archived', que a loja continuaria a
// esconder).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function syncVisibility(body: any) {
  const data: Record<string, unknown> = { ...body }
  if (typeof data.active === 'boolean' && data.visibility === undefined) {
    if (data.active) {
      data.visibility = 'visible'
    } else if (data.active === false) {
      // Só rebaixa para 'hidden' se ainda estava 'visible' — não mexe em
      // archived/maintenance/etc. definidos explicitamente noutro lado.
      data.visibility = 'hidden'
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const product = await prisma.product.update({ where: { id }, data: syncVisibility(body) })
  return NextResponse.json(product)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const product = await prisma.product.update({ where: { id }, data: syncVisibility(body) })
  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  const { id } = await params
  await prisma.product.update({ where: { id }, data: { active: false, visibility: 'archived' } })
  return NextResponse.json({ success: true })
}
