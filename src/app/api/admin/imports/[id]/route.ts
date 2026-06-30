import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.supplierId !== undefined) data.supplierId = body.supplierId
  if (body.reference !== undefined) data.reference = body.reference
  if (body.totalCost !== undefined) data.totalCost = Number(body.totalCost)
  if (body.shippingCost !== undefined) data.shippingCost = Number(body.shippingCost)
  if (body.customsDuty !== undefined) data.customsDuty = Number(body.customsDuty)
  if (body.otherCosts !== undefined) data.otherCosts = Number(body.otherCosts)
  if (body.totalLanded !== undefined) data.totalLanded = Number(body.totalLanded)
  if (body.status !== undefined) data.status = body.status
  if ('estimatedArrival' in body) data.estimatedArrival = body.estimatedArrival ? new Date(body.estimatedArrival) : null
  if ('notes' in body) data.notes = body.notes || null
  const imp = await prisma.import.update({
    where: { id },
    data,
    include: { supplier: { select: { name: true, country: true } } },
  })
  return NextResponse.json(imp)
}
