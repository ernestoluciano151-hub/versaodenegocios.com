import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Truck, CreditCard } from 'lucide-react'
import { prisma } from '@/lib/prisma'

// Trust badges — always shown below the banner
const TRUST_BADGES = [
  { icon: Truck, title: 'Entrega em Luanda', desc: 'Entregamos ao seu domicílio' },
  { icon: Shield, title: 'Garantia de Qualidade', desc: 'Produtos certificados' },
  { icon: CreditCard, title: 'Pagamento na Entrega', desc: 'Pague quando receber' },
]

export async function HeroBanner() {
  // Fetch active banners from DB (first one displayed as hero)
  let banners: Array<{
    id: string; title: string; subtitle: string | null
    ctaLabel: string | null; ctaUrl: string | null
    ctaLabel2: string | null; ctaUrl2: string | null
    imageUrl: string | null; bgColor: string; textColor: string
  }> = []

  try {
    banners = await prisma.heroBanner.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      take: 1,
    })
  } catch {
    // Table may not exist yet (before migration) — fall through to static fallback
  }

  const banner = banners[0]

  return (
    <section className="relative overflow-hidden">
      {banner ? (
        // ── Dynamic banner from DB ──────────────────────────────────────────
        <div
          className="relative text-white"
          style={{
            backgroundColor: banner.bgColor,
            backgroundImage: banner.imageUrl ? `url(${banner.imageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {banner.imageUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: banner.textColor }}>
                {banner.title}
              </h1>
              {banner.subtitle && (
                <p className="text-lg mb-8 leading-relaxed opacity-80" style={{ color: banner.textColor }}>
                  {banner.subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {banner.ctaLabel && banner.ctaUrl && (
                  <Link href={banner.ctaUrl}>
                    <Button size="lg" className="gap-2">
                      {banner.ctaLabel} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                {banner.ctaLabel2 && banner.ctaUrl2 && (
                  <Link href={banner.ctaUrl2}>
                    <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 hover:text-white">
                      {banner.ctaLabel2}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ── Static fallback (before any banner is created in admin) ────────
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1 text-sm text-orange-400 mb-6">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                Novos produtos em stock
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Tecnologia de
                <span className="text-orange-400"> ponta </span>
                ao seu alcance
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Produtos eletrónicos importados directamente da China, EUA, Portugal e Brasil.
                Qualidade garantida, preços competitivos, entrega em Luanda.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/produtos">
                  <Button size="lg" className="gap-2">
                    Ver Produtos <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/produtos?destaque=true">
                  <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 hover:text-white">
                    Ver Promoções
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust badges */}
      <div className="relative border-t border-gray-700/50 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TRUST_BADGES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
