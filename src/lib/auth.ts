import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'
import { rateLimit } from '@/lib/rate-limit'

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
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // Base behaviour from authConfig
      if (user) {
        token.id = user.id
        token.type = (user as { type?: string }).type ?? 'admin'
        token.role = (user as { role?: string }).role
        token.loginAt = Date.now()
      }
      // OAuth providers — always customer, and ensure we store the DB customer ID
      if (account?.provider && !['admin-credentials', 'customer-credentials'].includes(account.provider)) {
        token.type = 'customer'
        const email = (user?.email ?? token.email) as string | undefined
        if (email) {
          const customer = await prisma.customer.findUnique({ where: { email } })
          if (customer) token.id = customer.id
        }
      }
      return token
    },
  },
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

    Credentials({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Palavra-passe', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        // ── Brute-force protection — IP from server request (cannot be spoofed by client) ──
        const ip = (request as Request | undefined)?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
        const rlIp    = rateLimit(`admin-login:ip:${ip}`,              10, 15 * 60_000)
        const rlEmail = rateLimit(`admin-login:email:${credentials.email}`, 5, 15 * 60_000)
        if (!rlIp.allowed || !rlEmail.allowed) return null

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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        // ── Brute-force protection — IP from server request ──
        const ip = (request as Request | undefined)?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
        const rlIp    = rateLimit(`customer-login:ip:${ip}`,              20, 15 * 60_000)
        const rlEmail = rateLimit(`customer-login:email:${credentials.email}`, 10, 15 * 60_000)
        if (!rlIp.allowed || !rlEmail.allowed) return null

        const customer = await prisma.customer.findUnique({ where: { email: credentials.email as string } })
        if (!customer || !customer.active || !customer.password) return null
        const isValid = await bcrypt.compare(credentials.password as string, customer.password)
        if (!isValid) return null

        return { id: customer.id, name: customer.name, email: customer.email, image: customer.avatar, type: 'customer' }
      },
    }),
  ],
})
