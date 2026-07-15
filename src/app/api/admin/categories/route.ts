import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const search    = searchParams.get('search') ?? ''
    const status    = searchParams.get('status') ?? 'all'
    const visible   = searchParams.get('visible') ?? 'all'
    const featured  = searchParams.get('featured') ?? 'all'
    const parentId  = searchParams.get('parentId') ?? ''
    const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const skip      = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { slug:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active')   where.active = true
    if (status === 'inactive') where.active = false

    if (visible === 'true')  where.isVisible = true
    if (visible === 'false') where.isVisible = false

    if (featured === 'true')  where.isFeatured = true
    if (featured === 'false') where.isFeatured = false

    if (parentId === 'root') {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
    }

    const [categories, total, statsRaw] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { products: true, children: true } },
          parent: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.category.count({ where }),
      prisma.category.findMany({
        select: {
          active: true,
          isVisible: true,
          isFeatured: true,
          _count: { select: { products: true } },
        },
      }),
    ])

    const stats = {
      total:           statsRaw.length,
      active:          statsRaw.filter(c => c.active).length,
      inactive:        statsRaw.filter(c => !c.active).length,
      visible:         statsRaw.filter(c => c.isVisible).length,
      hidden:          statsRaw.filter(c => !c.isVisible).length,
      featured:        statsRaw.filter(c => c.isFeatured).length,
      withProducts:    statsRaw.filter(c => c._count.products > 0).length,
      withoutProducts: statsRaw.filter(c => c._count.products === 0).length,
    }

    return NextResponse.json({
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    })
  } catch (err) {
    console.error('[GET /api/admin/categories]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const {
      name, slug: slugInput, description,
      image, icon, bannerDesktop, bannerMobile, ogImage,
      parentId,
      active, isVisible, isFeatured, displayOrder, color,
      showInHomepage, showInMenu, showInMobileMenu, showInFooter,
      seoTitle, seoDescription, seoKeywords, customUrl,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'O campo "name" é obrigatório' }, { status: 400 })
    }

    const slug = slugInput?.trim() ? slugInput.trim() : slugify(name)

    const adminId = (session?.user as { id?: string })?.id ?? null

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description:      description      ?? null,
        image:            image            ?? null,
        icon:             icon             ?? null,
        bannerDesktop:    bannerDesktop    ?? null,
        bannerMobile:     bannerMobile     ?? null,
        ogImage:          ogImage          ?? null,
        parentId:         parentId         ?? null,
        active:           active           ?? true,
        isVisible:        isVisible        ?? true,
        isFeatured:       isFeatured       ?? false,
        displayOrder:     displayOrder     ?? 0,
        color:            color            ?? null,
        showInHomepage:   showInHomepage   ?? false,
        showInMenu:       showInMenu       ?? true,
        showInMobileMenu: showInMobileMenu ?? true,
        showInFooter:     showInFooter     ?? false,
        seoTitle:         seoTitle         ?? null,
        seoDescription:   seoDescription   ?? null,
        seoKeywords:      seoKeywords      ?? null,
        customUrl:        customUrl        ?? null,
        createdBy:        adminId,
      },
      include: {
        _count:  { select: { products: true, children: true } },
        parent:  { select: { id: true, name: true, slug: true } },
        children: true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (err: unknown) {
    console.error('[POST /api/admin/categories]', err)
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
