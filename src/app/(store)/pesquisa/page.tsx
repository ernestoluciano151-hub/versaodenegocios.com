export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/store/ProductCard'
import { SearchInput } from './SearchInput'
import { Search, PackageOpen } from 'lucide-react'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Pesquisa | VN Commerce` : 'Pesquisa | VN Commerce',
    description: q ? `Resultados de pesquisa para "${q}" na VN Commerce.` : 'Pesquise produtos na VN Commerce.',
  }
}

export default async function PesquisaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const products = query.length >= 2
    ? await prisma.product.findMany({
        where: {
          active: true,
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { isBestseller: 'desc' },
        take: 48,
      })
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Pesquisar Produtos</h1>
        <SearchInput initialValue={query} />
      </div>

      {/* Results */}
      {query.length >= 2 ? (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {products.length === 0
              ? `Nenhum resultado para "${query}"`
              : `${products.length} resultado${products.length !== 1 ? 's' : ''} para "${query}"`}
          </p>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <PackageOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Nenhum produto encontrado.</p>
              <p className="text-sm text-gray-400">Tente outros termos ou navegue pelas categorias.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product as Parameters<typeof ProductCard>[0]['product']} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">Escreva pelo menos 2 caracteres para pesquisar.</p>
        </div>
      )}
    </div>
  )
}
