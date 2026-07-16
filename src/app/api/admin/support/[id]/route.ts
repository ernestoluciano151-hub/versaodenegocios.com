import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { adminReply, status } = await req.json()
  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { adminReply, status, repliedAt: adminReply ? new Date() : undefined, updatedAt: new Date() },
  })
  // Create notification for customer
  if (adminReply) {
    await prisma.notification.create({
      data: {
        customerId: ticket.customerId,
        type: 'support_reply',
        title: 'Resposta ao seu pedido de suporte',
        message: `A equipa respondeu ao ticket: "${ticket.subject}"`,
        data: { ticketId: id, route: '/conta/suporte' },
      },
    })
  }
  return NextResponse.json(ticket)
}
