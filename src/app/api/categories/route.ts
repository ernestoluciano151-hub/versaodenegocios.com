import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Revalidate at most once per 60 seconds — categories change infrequently
export const revalidate = 60

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active:    true,
        isVisible: true,
        deletedAt: null,
        parentId:  null, // top-level only; children fetched nested below
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          where:   { active: true, isVisible: true, deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          include: {
            children: {
              where:   { active: true, isVisible: true, deletedAt: null },
              orderBy: { displayOrder: 'asc' },
              select: {
                id: true, name: true, slug: true, image: true, icon: true,
                color: true, displayOrder: true,
                showInMenu: true, showInMobileMenu: true,
                showInHomepage: true, showInFooter: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(categories, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
