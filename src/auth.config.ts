import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/conta/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.type = (user as { type?: string }).type ?? 'admin'
        token.role = (user as { role?: string }).role
      }
      // OAuth providers (Google, Microsoft, Apple) are always customers
      if (account?.provider && account.provider !== 'admin-credentials' && account.provider !== 'customer-credentials') {
        token.type = 'customer'
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/conta`
    },
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl
      const token = auth
      const type = (token?.user as { type?: string } | null)?.type

      if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        if (!token || type !== 'admin') {
          const loginUrl = new URL('/admin/login', nextUrl)
          loginUrl.searchParams.set('callbackUrl', pathname)
          return Response.redirect(loginUrl)
        }
      }

      if (
        pathname.startsWith('/conta') &&
        !pathname.startsWith('/conta/login') &&
        !pathname.startsWith('/conta/registar') &&
        !pathname.startsWith('/conta/recuperar-password') &&
        !pathname.startsWith('/conta/redefinir-password')
      ) {
        if (!token || type !== 'customer') {
          const loginUrl = new URL('/conta/login', nextUrl)
          loginUrl.searchParams.set('callbackUrl', pathname)
          return Response.redirect(loginUrl)
        }
      }

      return true
    },
  },
}
