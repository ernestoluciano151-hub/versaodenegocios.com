'use client'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('vn_sid')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('vn_sid', sid)
  }
  return sid
}

export function trackEvent(
  type: string,
  extra?: { productId?: string; orderId?: string; metadata?: object }
) {
  if (typeof window === 'undefined') return
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      sessionId: getSessionId(),
      page: window.location.pathname,
      referrer: document.referrer || null,
      ...extra,
    }),
    keepalive: true,
  }).catch(() => {})
}

export function AnalyticsTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef('')

  useEffect(() => {
    const current = pathname + searchParams.toString()
    if (current === lastPath.current) return
    lastPath.current = current
    trackEvent('page_view')
  }, [pathname, searchParams])

  return null
}
