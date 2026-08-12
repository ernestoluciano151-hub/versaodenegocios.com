import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { SearchModal } from '@/components/store/SearchModal'
import { PWAInstaller } from '@/components/store/PWAInstaller'
import { AnalyticsTracker } from '@/components/store/AnalyticsTracker'
import { AffiliateTracker } from '@/components/store/AffiliateTracker'
import { TrackingScripts } from '@/components/store/TrackingScripts'
import { TopLoadingBar } from '@/components/store/TopLoadingBar'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: { default: 'VN Commerce — Produtos Eletrónicos', template: '%s | VN Commerce' },
  description: 'Especialistas em produtos eletrónicos importados. Smartphones, computadores, áudio, TV e muito mais.',
  openGraph: { type: 'website', locale: 'pt_AO', siteName: 'VN Commerce' },
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const trackingSettings = await prisma.analyticsSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null)

  return (
    <div className="flex flex-col min-h-screen">
      <TrackingScripts settings={trackingSettings} />
      <Suspense fallback={null}>
        <TopLoadingBar />
      </Suspense>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchModal />
      <PWAInstaller />
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>
    </div>
  )
}
