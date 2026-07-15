import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from '@/lib/customer-auth'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let customer: { id: string; name: string; email: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  }

  const message = {
    id: `msg_${Date.now()}`,
    orderId: id,
    author: 'customer',
    authorName: customer.name,
    text: body.text,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json(message, { status: 201 })
}
