import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id'
import Apple from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'

async function findOrCreateCustomer(profile: { email: string; name?: string | null; image?: string | null }) {
  let customer = await prisma.customer.findUnique({ where: { email: profile.email } })
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email: profile.email,
        name: profile.name ?? profile.email.split('@')[0],
        avatar: profile.image ?? null,
        active: true,
      },
    })
  }
  return customer
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        const customer = await findOrCreateCustomer({
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        })
        return { id: customer.id, name: customer.name, email: customer.email, image: customer.avatar, type: 'customer' }
      },
    }),
    MicrosoftEntraId({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      async profile(profile) {
        const customer = await findOrCreateCustomer({
          email: profile.email ?? profile.preferred_username,
          name: profile.name,
          image: null,
        })
        return { id: customer.id, name: customer.name, email: customer.email, image: customer.avatar, type: 'customer' }
      },
    }),
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      async profile(profile) {
        const customer = await findOrCreateCustomer({
          email: profile.email,
          name: profile.name ? `${profile.name.firstName ?? ''} ${profile.name.lastName ?? ''}`.trim() : null,
          image: null,
        })
        return { id: customer.id, name: customer.name, email: customer.email, image: customer.avatar, type: 'customer' }
      },
    }),
    Credentials({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Palavra-passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } })
        if (!user || !user.active) return null
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role, image: user.avatar, type: 'admin' }
      },
    }),
    Credentials({
      id: 'customer-credentials',
      name: 'Cliente',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Palavra-passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const customer = await prisma.customer.findUnique({ where: { email: credentials.email as string } })
        if (!customer || !customer.active || !customer.password) return null
        const isValid = await bcrypt.compare(credentials.password as string, customer.password)
        if (!isValid) return null
        return { id: customer.id, name: customer.name, email: customer.email, image: customer.avatar, type: 'customer' }
      },
    }),
  ],
})
