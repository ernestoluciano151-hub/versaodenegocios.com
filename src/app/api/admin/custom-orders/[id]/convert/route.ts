import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const order = await prisma.customOrder.findUnique({
    where: { id },
  })

  if (!order) {
    return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 })
  }

  if (order.status !== 'approved') {
    return NextResponse.json(
      { error: 'Só é possível converter encomendas com status "approved".' },
      { status: 400 }
    )
  }

  if (order.convertedProductId) {
    return NextResponse.json(
      { error: 'Esta encomenda já foi convertida num produto.' },
      { status: 409 }
    )
  }

  // Find a default category if none is set
  let categoryId = order.categoryId
  if (!categoryId) {
    const defaultCategory = await prisma.category.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    categoryId = defaultCategory?.id ?? null
  }

  const product = await prisma.product.create({
    data: {
      name: order.productName,
      slug: slugify(order.productName + '-' + Date.now()),
      brand: 'VN Commerce',
      categoryId: categoryId!,
      description: order.notes ?? '',
      technicalSpecs: {},
      originCountry: order.origin,
      images: (order.images as string[]) ?? [],
      price: order.quotedPrice ?? 0,
      sku: `CO-${order.reference}`,
      stock: order.quantity,
      minStock: 1,
      active: false,
      visibility: 'hidden',
    },
  })

  await prisma.customOrder.update({
    where: { id },
    data: { convertedProductId: product.id },
  })

  return NextResponse.json({ product, message: 'Produto criado com sucesso.' }, { status: 201 })
}
