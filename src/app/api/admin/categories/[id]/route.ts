import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent:   { select: { id: true, name: true, slug: true } },
        children: {
          where:   { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true, name: true, slug: true, image: true, icon: true,
            active: true, isVisible: true, isFeatured: true, displayOrder: true,
            _count: { select: { products: true, children: true } },
          },
        },
        products: {
          where:  { deletedAt: null },
          select: { id: true, active: true, stock: true, salePrice: true, price: true },
        },
        _count: { select: { products: true, children: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const products = category.products
    const activeProducts   = products.filter(p => p.active).length
    const inactiveProducts = products.filter(p => !p.active).length
    const outOfStock       = products.filter(p => (p.stock ?? 0) <= 0).length
    const onSale           = products.filter(
      p => p.salePrice !== null && Number(p.salePrice) < Number(p.price)
    ).length
    const totalStockValue  = products.reduce(
      (acc, p) => acc + (p.stock ?? 0) * Number(p.price),
      0
    )
    const totalRevenue = 0

    const { products: _products, ...rest } = category

    return NextResponse.json({
      ...rest,
      productStats: {
        total: products.length,
        activeProducts,
        inactiveProducts,
        outOfStock,
        onSale,
        totalStockValue,
        totalRevenue,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/categories/[id]]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.category.findUnique({ where: { id }, select: { name: true, slug: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const {
      name, slug: slugInput, description,
      image, icon, bannerDesktop, bannerMobile, ogImage,
      parentId,
      active, isVisible, isFeatured, displayOrder, color,
      showInHomepage, showInMenu, showInMobileMenu, showInFooter,
      seoTitle, seoDescription, seoKeywords, customUrl,
    } = body

    // Regenerate slug only when name changed and no explicit slug provided
    let slug: string | undefined
    if (slugInput !== undefined) {
      slug = slugInput.trim() || undefined
    } else if (name !== undefined && name !== existing.name) {
      slug = slugify(name)
    }

    const adminId = (session?.user as { id?: string })?.id ?? null

    const updateData: Record<string, unknown> = { updatedBy: adminId }

    if (name           !== undefined) updateData.name           = name
    if (slug           !== undefined) updateData.slug           = slug
    if (description    !== undefined) updateData.description    = description
    if (image          !== undefined) updateData.image          = image
    if (icon           !== undefined) updateData.icon           = icon
    if (bannerDesktop  !== undefined) updateData.bannerDesktop  = bannerDesktop
    if (bannerMobile   !== undefined) updateData.bannerMobile   = bannerMobile
    if (ogImage        !== undefined) updateData.ogImage        = ogImage
    if (parentId       !== undefined) updateData.parentId       = parentId
    if (active         !== undefined) updateData.active         = active
    if (isVisible      !== undefined) updateData.isVisible      = isVisible
    if (isFeatured     !== undefined) updateData.isFeatured     = isFeatured
    if (displayOrder   !== undefined) updateData.displayOrder   = displayOrder
    if (color          !== undefined) updateData.color          = color
    if (showInHomepage   !== undefined) updateData.showInHomepage   = showInHomepage
    if (showInMenu       !== undefined) updateData.showInMenu       = showInMenu
    if (showInMobileMenu !== undefined) updateData.showInMobileMenu = showInMobileMenu
    if (showInFooter     !== undefined) updateData.showInFooter     = showInFooter
    if (seoTitle       !== undefined) updateData.seoTitle       = seoTitle
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription
    if (seoKeywords    !== undefined) updateData.seoKeywords    = seoKeywords
    if (customUrl      !== undefined) updateData.customUrl      = customUrl

    const category = await prisma.category.update({
      where: { id },
      data:  updateData,
      include: {
        _count:  { select: { products: true, children: true } },
        parent:  { select: { id: true, name: true, slug: true } },
        children: {
          where:   { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          select:  { id: true, name: true, slug: true, active: true, isVisible: true },
        },
      },
    })

    return NextResponse.json(category)
  } catch (err: unknown) {
    console.error('[PATCH /api/admin/categories/[id]]', err)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Slug já existe. Use um slug diferente.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params

    const existing = await prisma.category.findUnique({ where: { id }, select: { id: true, deletedAt: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }

    const category = await prisma.category.update({
      where: { id },
      data:  { deletedAt: new Date() },
      select: { id: true, name: true, slug: true, deletedAt: true },
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error('[DELETE /api/admin/categories/[id]]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
