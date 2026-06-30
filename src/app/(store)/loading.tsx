export default function StoreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero skeleton */}
      <div className="w-full h-64 md:h-96 bg-gray-100 rounded-2xl animate-pulse mb-10" />
      {/* Section */}
      <div className="h-6 bg-gray-100 rounded animate-pulse w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 animate-pulse" style={{ paddingBottom: '100%' }} />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-16" />
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-5 bg-gray-100 rounded animate-pulse w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
