import { prisma } from '@/lib/prisma'

/**
 * Deduz o stock de uma encomenda paga via Multicaixa Express (GPO) assim que
 * o pagamento é confirmado — ao contrário dos outros métodos (cash on
 * delivery, referência, transferência bancária), que só deduzem o stock
 * quando o admin marca a encomenda como "entregue" (ver
 * PATCH /api/orders/[id]).
 *
 * Chamado a partir de dois sítios que podem confirmar o pagamento GPO:
 *   - o webhook da EasyPay/AppyPay (/api/webhooks/emis)
 *   - o polling activo da página de espera (/api/payments/verify)
 *
 * Protegido contra reprocessamento pelo flag `stockDeducted` da Order —
 * ambos os caminhos podem confirmar o mesmo pagamento, mas o stock só é
 * deduzido uma vez.
 */
export async function deductStockOnGpoPayment(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        stockDeducted: true,
        items: { select: { productId: true, quantity: true } },
      },
    })
    if (!order) return

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'processing', ...(order.stockDeducted ? {} : { stockDeducted: true }) },
    })

    if (order.stockDeducted) return // já deduzido — evita duplicar (webhook + polling podem ambos confirmar)

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          reference: `Pedido #${orderId.slice(-8).toUpperCase()}`,
          notes: 'Saída — pagamento Multicaixa Express confirmado (GPO)',
        },
      })
    }
  })
}
