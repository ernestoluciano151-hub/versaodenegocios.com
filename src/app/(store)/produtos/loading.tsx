import { ProductCardSkeleton } from '@/components/store/ProductCard'

export default function ProdutosLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            ))}
          </div>
        </aside>

        {/* Products grid skeleton */}
        <div className="flex-1">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-32 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
