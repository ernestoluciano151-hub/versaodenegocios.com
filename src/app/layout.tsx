import type { Metadata, Viewport } from 'next'
import './globals.css'
import { prisma } from '@/lib/prisma'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://versaodenegocios.com'

// Antes desta correcção, Configurações → SEO existia no admin (título do
// site, descrição, palavras-chave, verificação Google, imagem OG) mas não
// tinha qualquer efeito — esta metadata ficava sempre fixa no código. Agora
// os valores da BD sobrepõem-se aos valores por omissão abaixo, campo a
// campo, para o site nunca ficar sem metadata caso a configuração esteja
// vazia.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null)

  const title = seo?.siteTitle || 'VN Commerce — Produtos Electrónicos'
  const description = seo?.siteDescription || 'Especialistas em produtos eletrónicos importados. Smartphones, computadores, áudio, TV e muito mais.'
  const ogImage = seo?.ogImage || '/og-image.png'
  const keywords = seo?.keywords
    ? seo.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : ['electrónica', 'angola', 'smartphones', 'computadores', 'loja online']
  const robotsStr = seo?.robots ?? 'index, follow'
  const index = !robotsStr.includes('noindex')
  const follow = !robotsStr.includes('nofollow')

  return {
    title: { default: title, template: `%s | ${title.split('—')[0].trim() || 'VN Commerce'}` },
    description,
    metadataBase: new URL(APP_URL),
    manifest: '/manifest.json',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/logo.svg', sizes: '96x96', type: 'image/png' },
        { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
      shortcut: '/favicon.ico',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'VN Commerce',
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: 'website',
      siteName: 'VN Commerce',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next/Metadata só tipa os valores fixos conhecidos do Twitter Card
      card: (seo?.twitterMeta || 'summary_large_image') as any,
      title,
      description,
    },
    robots: { index, follow },
    keywords,
    ...(seo?.googleVerification ? { verification: { google: seo.googleVerification } } : {}),
    ...(seo?.facebookMeta ? { other: { 'facebook-domain-verification': seo.facebookMeta } } : {}),
  }
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO" className="h-full">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
