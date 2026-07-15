import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// In-memory store until DB migration adds CustomOrder model
let ORDERS: Record<string, unknown>[] = [
  {
    id: 'co_demo1',
    reference: 'EP-2026-0001',
    status: 'pending',
    customerName: 'Maria Silva',
    customerEmail: 'maria@exemplo.com',
    customerPhone: '+244 923 456 789',
    description: 'Necessito de 50 camisas personalizadas com o logótipo da empresa, tamanhos M e L.',
    budget: 250000,
    attachments: [],
    messages: [
      { id: 'm1', author: 'customer', text: 'Bom dia, tenho urgência nesta encomenda.', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'co_demo2',
    reference: 'EP-2026-0002',
    status: 'in_progress',
    customerName: 'João Baptista',
    customerEmail: 'joao@empresa.ao',
    customerPhone: '+244 912 345 678',
    description: 'Canecas personalizadas para evento corporativo — 100 unidades com arte fornecida.',
    budget: 150000,
    attachments: [],
    messages: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
]

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('q')

  let orders = [...ORDERS]

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.status === status)
  }
  if (search) {
    const q = search.toLowerCase()
    orders = orders.filter(
      (o) =>
        String(o.customerName).toLowerCase().includes(q) ||
        String(o.description).toLowerCase().includes(q) ||
        String(o.reference).toLowerCase().includes(q)
    )
  }

  const stats = {
    total: ORDERS.length,
    pending: ORDERS.filter((o) => o.status === 'pending').length,
    in_progress: ORDERS.filter((o) => o.status === 'in_progress').length,
    delivered: ORDERS.filter((o) => o.status === 'delivered').length,
  }

  return NextResponse.json({ orders, stats })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const order = {
    id: `co_${Date.now()}`,
    reference: `EP-${new Date().getFullYear()}-${String(ORDERS.length + 1).padStart(4, '0')}`,
    status: 'pending',
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    description: body.description,
    budget: body.budget ?? null,
    attachments: body.attachments ?? [],
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  ORDERS.unshift(order)
  return NextResponse.json(order, { status: 201 })
}
