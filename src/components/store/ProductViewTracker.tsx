'use client'

import { useEffect } from 'react'
import { track, CURRENCY } from '@/lib/metaPixel'

interface Props {
  contentId: string
  name: string
  category: string | null
  value: number
}

/** Meta Pixel ViewContent — disparado quando a página de produto carrega. */
export function ProductViewTracker({ contentId, name, category, value }: Props) {
  useEffect(() => {
    track('ViewContent', {
      content_ids: [contentId],
      content_type: 'product',
      content_name: name,
      ...(category ? { content_category: category } : {}),
      value,
      currency: CURRENCY,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  return null
}
