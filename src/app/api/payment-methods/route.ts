import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payment-methods — pública.
 *
 * Devolve os métodos de pagamento que a loja deve mostrar no checkout,
 * reflectindo o que o admin configurou em Configurações > Pagamentos
 * (status: active/inactive/maintenance/coming_soon, showInStore).
 *
 * Isto é a fonte de verdade única — o checkout deixa de decidir por conta
 * própria quais métodos mostrar/activar.
 */
export async function GET() {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { showInStore: true },
      select: { type: true, name: true, status: true, description: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(methods, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  } catch (err) {
    console.error('[GET /api/payment-methods]', err)
    // Falha aberta com um conjunto mínimo seguro, para o checkout nunca ficar sem opções
    return NextResponse.json([
      { type: 'cash_on_delivery', name: 'Pagamento na Entrega', status: 'active', description: null, sortOrder: 0 },
    ])
  }
}
