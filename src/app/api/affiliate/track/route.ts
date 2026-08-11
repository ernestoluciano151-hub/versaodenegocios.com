import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AFFILIATE_COOKIE } from '@/lib/affiliate'

export const dynamic = 'force-dynamic'

/**
 * POST /api/affiliate/track — pública.
 *
 * Regista o clique num link de afiliado (?ref=CODE) e define o cookie de
 * atribuição que o checkout lê mais tarde para gerar a comissão. Sem isto,
 * o programa de afiliados nunca gerava cliques nem vendas — o painel admin
 * já lê `clicks`/`commissions`, só nunca havia dados a chegar.
 */
export async function POST(req: NextRequest) {
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const code = body.code?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'code obrigatório' }, { status: 400 })

  const affiliate = await prisma.affiliate.findUnique({
    where: { code },
    select: { id: true, status: true, cookieDays: true },
  }).catch(() => null)

  if (!affiliate || affiliate.status !== 'active') {
    // Código inválido ou afiliado inactivo — não regista, não define cookie
    return NextResponse.json({ tracked: false })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = req.headers.get('user-agent') ?? null
  const referrer = req.headers.get('referer') ?? null

  await prisma.$transaction([
    prisma.affiliateClick.create({
      data: { affiliateId: affiliate.id, ip, userAgent, referrer },
    }),
    prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { totalClicks: { increment: 1 } },
    }),
  ])

  const res = NextResponse.json({ tracked: true })
  res.cookies.set(AFFILIATE_COOKIE, code, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * affiliate.cookieDays,
    path: '/',
  })
  return res
}
