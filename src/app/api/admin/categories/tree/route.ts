import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface CategoryNode {
  id:           string
  name:         string
  slug:         string
  image:        string | null
  icon:         string | null
  isVisible:    boolean
  isFeatured:   boolean
  active:       boolean
  displayOrder: number
  color:        string | null
  _count:       { products: number; children: number }
  children:     CategoryNode[]
}

function buildTree(
  flat: (Omit<CategoryNode, 'children'> & { parentId: string | null })[],
  parentId: string | null = null
): CategoryNode[] {
  return flat
    .filter(c => c.parentId === parentId)
    .map(c => ({
      ...c,
      children: buildTree(flat, c.id),
    }))
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const categories = await prisma.category.findMany({
      where:   { deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      select: {
        id:           true,
        name:         true,
        slug:         true,
        image:        true,
        icon:         true,
        isVisible:    true,
        isFeatured:   true,
        active:       true,
        displayOrder: true,
        color:        true,
        parentId:     true,
        _count:       { select: { products: true, children: true } },
      },
    })

    const tree = buildTree(categories)

    return NextResponse.json({ tree })
  } catch (err) {
    console.error('[GET /api/admin/categories/tree]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
