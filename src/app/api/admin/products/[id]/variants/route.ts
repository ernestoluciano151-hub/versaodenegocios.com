import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

type Params = { params: Promise<{ id: string }> }

// GET /api/admin/products/[id]/variants
export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { id } = await params
  const variants = await prisma.productVariant.findMany({
    where: { productId: id },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json(variants)
}

// POST /api/admin/products/[id]/variants — create variant
export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  const { id: productId } = await params
  const body = await req.json()
  const { name, sku, barcode, price, comparePrice, purchasePrice, stock, minStock, imageUrl, weight, position, isActive, attributes } = body

  if (!name || !sku || price === undefined) {
    return NextResponse.json({ error: 'name, sku e price obrigatórios' }, { status: 400 })
  }

  const exists = await prisma.productVariant.findUnique({ where: { sku } })
  if (exists) return NextResponse.json({ error: 'SKU já existe' }, { status: 409 })

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      name,
      sku,
      barcode,
      price,
      comparePrice,
      purchasePrice,
      stock: stock ?? 0,
      minStock: minStock ?? 0,
      imageUrl,
      weight,
      position: position ?? 0,
      isActive: isActive ?? true,
      attributes: attributes ?? {},
    },
  })
  return NextResponse.json(variant, { status: 201 })
}

// PATCH /api/admin/products/[id]/variants — bulk reorder or update
// Body: [{ id, position }] for reorder  OR  { id, ...fields } for single update
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status: 401 })

  await params
  const body = await req.json()

  // Reorder: array of { id, position }
  if (Array.isArray(body)) {
    await Promise.all(
      body.map(({ id, position }: { id: string; position: number }) =>
        prisma.productVariant.update({ where: { id }, data: { position } })
      )
    )
    return NextResponse.json({ success: true })
  }

  // Single update
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const variant = await prisma.productVariant.update({ where: { id }, data })
  return NextResponse.json(variant)
}
