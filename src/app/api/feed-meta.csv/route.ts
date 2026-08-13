import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Feed de produtos para o Catálogo da Meta (Facebook/Instagram Shops, anúncios
// dinâmicos). Rota pública, sem autenticação — a Meta acede como bot anónimo
// e lê este URL várias vezes por dia. Tem de reflectir sempre a BD em tempo
// real, por isso nunca pode ser servida a partir de cache estática.
export const dynamic = 'force-dynamic'

const CSV_HEADER = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'brand',
  'product_type',
  'inventory',
]

const SITE_URL = 'https://versaodenegocios.com'

// Estados "seminovo" — tudo o que não é 'Novo' é reportado à Meta como
// "used". A Meta só aceita os valores "new", "refurbished" ou "used"; como
// o formulário admin usa uma escala mais granular (Como Novo, Bom Estado,
// Recondicionado, Para Peças), simplificamos para o par exigido pelo feed.
function mapCondition(condition: string): 'new' | 'used' {
  return condition === 'Novo' ? 'new' : 'used'
}

// Escapa um campo para CSV: aspas duplas à volta de qualquer valor que
// contenha vírgula, aspas ou quebra de linha, com aspas internas
// duplicadas. Nunca concatenamos vírgulas directamente numa string.
function csvField(value: string | number): string {
  const str = String(value)
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(fields: (string | number)[]): string {
  return fields.map(csvField).join(',') + '\r\n'
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatPrice(value: unknown): string {
  return `${Number(value).toFixed(2)} AOA`
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        visibility: 'visible',
        deletedAt: null,
      },
      select: {
        slug: true,
        name: true,
        description: true,
        brand: true,
        stock: true,
        condition: true,
        price: true,
        salePrice: true,
        images: true,
        category: { select: { name: true } },
      },
    })

    let rows = ''
    let count = 0

    for (const p of products) {
      const id = p.slug
      const link = `${SITE_URL}/produtos/${p.slug}`
      const imageLink = p.images?.[0] ?? ''
      const price = p.price

      // Filtro obrigatório: sem id, title, link, image_link ou price o item
      // é rejeitado pela Meta e só polui o diagnóstico do catálogo.
      if (!id || !p.name || !link || !imageLink || price == null) continue

      const title = p.name.slice(0, 200)

      const rawDescription = stripHtml(p.description ?? '')
      const description = (rawDescription || `${p.name} ${p.brand}`.trim()).slice(0, 9999)

      const availability = p.stock > 0 ? 'in stock' : 'out of stock'
      const condition = mapCondition(p.condition)

      const priceStr = formatPrice(price)
      const hasDiscount = p.salePrice != null && Number(p.salePrice) < Number(price)
      const salePriceStr = hasDiscount ? formatPrice(p.salePrice) : ''

      const brand = p.brand || 'VN Commerce'
      const productType = p.category?.name ?? ''
      const inventory = Math.max(0, Math.trunc(p.stock))

      rows += csvRow([
        id,
        title,
        description,
        availability,
        condition,
        priceStr,
        salePriceStr,
        link,
        imageLink,
        brand,
        productType,
        inventory,
      ])
      count++
    }

    const csv = csvRow(CSV_HEADER) + rows

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Feed-Product-Count': String(count),
      },
    })
  } catch (err) {
    console.error('[GET /api/feed-meta.csv]', err)
    // Mesmo em erro devolvemos um CSV válido (só o cabeçalho) em vez de um
    // JSON de erro — a Meta espera sempre CSV nesta rota.
    return new NextResponse(csvRow(CSV_HEADER), {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
}
