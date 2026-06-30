import type { Metadata } from 'next'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartDrawer } from '@/components/store/CartDrawer'
import { SearchModal } from '@/components/store/SearchModal'

export const metadata: Metadata = {
  title: { default: 'VN Tech — Produtos Eletrónicos', template: '%s | VN Tech' },
  description: 'Especialistas em produtos eletrónicos importados. Smartphones, computadores, áudio, TV e muito mais.',
  openGraph: {
    type: 'website',
    locale: 'pt_AO',
    siteName: 'VN Tech',
  },
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchModal />
    </div>
  )
}
