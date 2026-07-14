import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error


  const imports = await prisma.import.findMany({
    orderBy: { createdAt: 'desc' },
    include: { supplier: { select: { name: true, country: true } } },
    take: 100,
  })
  return NextResponse.json(imports)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error


  const body = await req.json()
  const { supplierId, reference, totalCost, shippingCost, customsDuty, otherCosts, totalLanded, estimatedArrival, notes, status } = body
  const imp = await prisma.import.create({
    data: {
      supplierId,
      reference,
      products: [],
      totalCost: Number(totalCost),
      shippingCost: Number(shippingCost ?? 0),
      customsDuty: Number(customsDuty ?? 0),
      otherCosts: Number(otherCosts ?? 0),
      totalLanded: Number(totalLanded ?? totalCost),
      estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
      notes: notes || null,
      status: status ?? 'pending',
    },
    include: { supplier: { select: { name: true, country: true } } },
  })
  return NextResponse.json(imp, { status: 201 })
}
