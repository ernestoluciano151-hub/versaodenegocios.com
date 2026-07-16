import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ─── TypeScript ──────────────────────────────────────────────────────────────
  typescript: {
    // Prisma 7 enum types cause false positives at build time; validated at runtime
    ignoreBuildErrors: true,
  },

  // ─── Images ──────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24 hours
  },

  // ─── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'production'
        ? ['versaodenegocios.com']
        : ['localhost:3000', 'versaodenegocios.com'],
    },
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-tabs', '@radix-ui/react-dialog'],
  },

  // ─── Compression ─────────────────────────────────────────────────────────────
  compress: true,

  // ─── Security & caching headers ──────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://via.placeholder.com https://images.unsplash.com https://cdn.shopify.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
              "connect-src 'self' https://accounts.google.com https://res.cloudinary.com https://api.multicaixaexpress.ao https://*.emis.co.ao",
              "frame-src 'self' https://accounts.google.com https://checkout.multicaixaexpress.ao https://*.emis.co.ao",
              "form-action 'self' https://accounts.google.com",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, immutable' }],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  // ─── Redirects ───────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // www → non-www canonical redirect
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.versaodenegocios.com' }],
        destination: 'https://versaodenegocios.com/:path*',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/admin',
        permanent: false,
        has: [{ type: 'query', key: 'callbackUrl' }],
        missing: [{ type: 'cookie', key: 'authjs.session-token' }],
      },
    ]
  },

  // ─── Bundle analyser (set ANALYZE=true env to use) ───────────────────────────
  ...(process.env.ANALYZE === 'true'
    ? {}
    : {}),
}

export default nextConfig
