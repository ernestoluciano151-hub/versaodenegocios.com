import type { NextAuthConfig } from 'next-auth'

const isProd = process.env.NODE_ENV === 'production'

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
    // Sessions expire after 24 h for admins (enforced in middleware via token.type).
    // Customer sessions live for 30 days — the JWT maxAge governs both,
    // so we set a conservative default and rely on the authorized() callback.
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ── Cookie hardening ──────────────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',   // lax needed for OAuth redirects; strict breaks Google login
        path: '/',
        secure: isProd,
      },
    },
    csrfToken: {
      name: isProd ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
  },
  pages: { signIn: '/conta/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.type = (user as { type?: string }).type ?? 'admin'
        token.role = (user as { role?: string }).role
        // Stamp login time — used to enforce shorter admin sessions
        token.loginAt = Date.now()
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
      // Only allow redirects to the same origin — prevent open redirect attacks
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/conta`
    },
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl
      const token = auth
      const type = (token?.user as { type?: string } | null)?.type

      // ── Admin routes ──────────────────────────────────────────────────────
      if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        if (!token || type !== 'admin') {
          const loginUrl = new URL('/admin/login', nextUrl)
          loginUrl.searchParams.set('callbackUrl', pathname)
          return Response.redirect(loginUrl)
        }

        // Admin sessions expire after 8 hours regardless of JWT maxAge
        const loginAt = (token as { loginAt?: number }).loginAt
        const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000
        if (loginAt && Date.now() - loginAt > ADMIN_SESSION_MS) {
          const loginUrl = new URL('/admin/login', nextUrl)
          loginUrl.searchParams.set('expired', '1')
          return Response.redirect(loginUrl)
        }
      }

      // ── Customer routes ───────────────────────────────────────────────────
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
