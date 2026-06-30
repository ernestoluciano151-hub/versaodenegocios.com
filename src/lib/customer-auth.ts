import { auth } from './auth'
import { prisma } from './prisma'

export type CustomerSession = {
  id: string
  name: string
  email: string
  image?: string | null
  type: 'customer'
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const session = await auth()
  if (!session?.user) return null
  const u = session.user as { id?: string; type?: string; name?: string; email?: string; image?: string }
  if (u.type !== 'customer') return null
  return {
    id: u.id!,
    name: u.name ?? '',
    email: u.email ?? '',
    image: u.image,
    type: 'customer',
  }
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] },
      _count: { select: { orders: true, wishlists: true, notifications: true } },
    },
  })
}
