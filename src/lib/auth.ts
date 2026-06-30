import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.type = (user as { type?: string }).type ?? 'admin'
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; role?: string; type?: string }
        u.id = token.id as string
        u.type = token.type as string
        u.role = token.role as string
      }
      return session
    },
  },
})
