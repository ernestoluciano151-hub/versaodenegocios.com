import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!token || (token as { type?: string }).type !== 'admin') {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (
    pathname.startsWith('/conta') &&
    !pathname.startsWith('/conta/login') &&
    !pathname.startsWith('/conta/registar')
  ) {
    if (!token || (token as { type?: string }).type !== 'customer') {
      const loginUrl = new URL('/conta/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*'],
}
