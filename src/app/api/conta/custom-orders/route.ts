import { NextRequest, NextResponse } from 'next/server'
import { requireCustomerSession } from "@/lib/customer-auth"

export const dynamic = 'force-dynamic'

// In-memory store shared with admin route (in production: DB)
let CUSTOMER_ORDERS: Record<string, unknown>[] = []

export async function GET(req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = CUSTOMER_ORDERS.filter((o) => o.customerId === customer.id)
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  let customer: { id: string; name: string; email: string; image?: string | null; type: string }
  try {
    customer = await requireCustomerSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (!body.description || String(body.description).trim().length < 20) {
    return NextResponse.json(
      { error: 'Descrição deve ter pelo menos 20 caracteres.' },
      { status: 400 }
    )
  }

  const order = {
    id: `co_${Date.now()}`,
    reference: `EP-${new Date().getFullYear()}-${String(CUSTOMER_ORDERS.length + 1).padStart(4, '0')}`,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    status: 'pending',
    description: body.description,
    budget: body.budget ?? null,
    attachments: [],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  CUSTOMER_ORDERS.unshift(order)
  return NextResponse.json(order, { status: 201 })
}
