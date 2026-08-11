'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Regista o clique uma única vez por código, por sessão de navegador —
// evita inflacionar totalClicks a cada navegação interna do visitante.
export function AffiliateTracker() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  useEffect(() => {
    if (!ref) return
    const key = `vn_aff_tracked_${ref}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ref }),
      keepalive: true,
    }).catch(() => {})
  }, [ref])

  return null
}
