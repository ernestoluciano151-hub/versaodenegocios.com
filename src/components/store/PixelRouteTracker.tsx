'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { track } from '@/lib/metaPixel'

/**
 * Dispara PageView do Meta Pixel a cada navegação SPA. O snippet base
 * (TrackingScripts.tsx) já dispara PageView no primeiro carregamento —
 * por isso o primeiro ciclo deste efeito é ignorado, para não duplicar.
 */
export function PixelRouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }
    track('PageView')
  }, [pathname, searchParams])

  return null
}
