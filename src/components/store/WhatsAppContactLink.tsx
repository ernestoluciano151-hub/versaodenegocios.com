'use client'

import type { ReactNode } from 'react'
import { track, toNumber, CURRENCY } from '@/lib/metaPixel'

interface Props {
  href: string
  className?: string
  children: ReactNode
  'aria-label'?: string
  /** Contexto opcional, quando o clique parte de uma página de produto. */
  product?: { name: string; slug: string; category?: string | null; price: number }
}

/**
 * Link de WhatsApp com Meta Pixel Contact — usado no rodapé (sem contexto
 * de produto). Mantém o Footer como Server Component; só este link precisa
 * de ser cliente por causa do onClick.
 */
export function WhatsAppContactLink({ href, className, children, product, ...rest }: Props) {
  function handleClick() {
    track('Contact', {
      content_name: product?.name ?? 'WhatsApp geral',
      ...(product ? { content_ids: [product.slug] } : {}),
      ...(product?.category ? { content_category: product.category } : {}),
      ...(product ? { value: toNumber(product.price), currency: CURRENCY } : {}),
    })
    // não bloquear a navegação para wa.me
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
