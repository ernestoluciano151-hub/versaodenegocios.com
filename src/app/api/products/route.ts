import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get('search')
  const categoria = searchParams.get('categoria')
  const limit = Number(searchParams.get('limit') ?? 20)
  const page = Number(searchParams.get('page') ?? 1)
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { active: true }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (categoria) where.category = { slug: categoria }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = where as any
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where: w, include: { category: { select: { name: true, slug: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.product.count({ where: w }),
  ])

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { name, brand, categoryId, description, price, sku, stock, images, technicalSpecs, originCountry, ...rest } = body

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      brand,
      categoryId,
      description,
      price,
      sku,
      stock: stock ?? 0,
      images: images ?? [],
      technicalSpecs: technicalSpecs ?? {},
      originCountry: originCountry ?? 'Angola',
      ...rest,
    },
  })

  if (product) {
    await prisma.inventory.create({
      data: { productId: product.id, quantity: product.stock, minStock: product.minStock },
    })
  }

  return NextResponse.json(product, { status: 201 })
}
