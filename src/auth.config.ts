import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [],
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
        !pathname.startsWith('/conta/registar')
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
