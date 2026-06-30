import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const user = req.auth?.user as { type?: string } | undefined

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!req.auth || user?.type !== 'admin') {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith('/conta') && !pathname.startsWith('/conta/login') && !pathname.startsWith('/conta/registar')) {
    if (!req.auth || user?.type !== 'customer') {
      const loginUrl = new URL('/conta/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/conta/:path*'],
}
