import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    include: { children: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const { name, description, parentId, image, order } = await req.json()
  const category = await prisma.category.create({
    data: { name, slug: slugify(name), description, parentId, image, order: order ?? 0 },
  })
  return NextResponse.json(category, { status: 201 })
}
