import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface PublicCategoryNode {
  id:           string
  name:         string
  slug:         string
  image:        string | null
  icon:         string | null
  color:        string | null
  isVisible:    boolean
  active:       boolean
  displayOrder: number
  showInMenu:       boolean
  showInMobileMenu: boolean
  showInHomepage:   boolean
  showInFooter:     boolean
  _count:   { products: number; children: number }
  children: PublicCategoryNode[]
}

function buildPublicTree(
  flat: (Omit<PublicCategoryNode, 'children'> & { parentId: string | null })[],
  parentId: string | null = null
): PublicCategoryNode[] {
  return flat
    .filter(c => c.parentId === parentId)
    .map(c => ({
      ...c,
      children: buildPublicTree(flat, c.id),
    }))
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active:    true,
        isVisible: true,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id:               true,
        name:             true,
        slug:             true,
        image:            true,
        icon:             true,
        color:            true,
        isVisible:        true,
        active:           true,
        displayOrder:     true,
        showInMenu:       true,
        showInMobileMenu: true,
        showInHomepage:   true,
        showInFooter:     true,
        parentId:         true,
        _count:           { select: { products: true, children: true } },
      },
    })

    const tree = buildPublicTree(categories)

    return NextResponse.json({ tree })
  } catch (err) {
    console.error('[GET /api/categories/tree]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
