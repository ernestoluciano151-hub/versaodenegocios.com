import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error


  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error


  const body = await req.json()
  const { code, type, value, minOrder, maxUses, expiresAt, active } = body
  const coupon = await prisma.coupon.create({
    data: {
      code: String(code).toUpperCase(),
      type,
      value: Number(value),
      minOrder: minOrder != null && minOrder !== '' ? Number(minOrder) : null,
      maxUses: maxUses != null && maxUses !== '' ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: active ?? true,
    },
  })
  return NextResponse.json(coupon, { status: 201 })
}
