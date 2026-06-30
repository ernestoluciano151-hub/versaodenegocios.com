import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json()

  if (!code) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: 'Cupão inválido ou expirado' }, { status: 404 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Cupão expirado' }, { status: 400 })
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: 'Cupão atingiu o limite de utilizações' }, { status: 400 })
  }

  if (coupon.minOrder && subtotal < Number(coupon.minOrder)) {
    return NextResponse.json({
      error: `Valor mínimo de ${Number(coupon.minOrder).toLocaleString('pt-AO')} AOA necessário`,
    }, { status: 400 })
  }

  const discount =
    coupon.type === 'percentage'
      ? (subtotal * Number(coupon.value)) / 100
      : Math.min(Number(coupon.value), subtotal)

  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount: Math.round(discount * 100) / 100,
  })
}
