import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

type Params = { params: Promise<{ id: string; variantId: string }> }

// PUT /api/admin/products/[id]/variants/[variantId]
export async function PUT(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { variantId } = await params
  const body = await req.json()
  const { name, sku, barcode, price, comparePrice, purchasePrice, stock, minStock, imageUrl, weight, position, isActive, attributes } = body

  // Check SKU uniqueness if changing
  if (sku) {
    const conflict = await prisma.productVariant.findFirst({ where: { sku, NOT: { id: variantId } } })
    if (conflict) return NextResponse.json({ error: 'SKU já em uso' }, { status: 409 })
  }

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { name, sku, barcode, price, comparePrice, purchasePrice, stock, minStock, imageUrl, weight, position, isActive, attributes },
  })
  return NextResponse.json(variant)
}

// DELETE /api/admin/products/[id]/variants/[variantId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { variantId } = await params
  await prisma.productVariant.delete({ where: { id: variantId } })
  return NextResponse.json({ success: true })
}
