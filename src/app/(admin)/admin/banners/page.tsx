import { HeroBannerManager } from './HeroBannerManager'

export const metadata = { title: 'Banners Hero | Admin' }

export default function BannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Banners da Homepage</h1>
        <p className="text-sm text-gray-500 mt-1">Gerir os banners exibidos na secção principal da loja.</p>
      </div>
      <HeroBannerManager />
    </div>
  )
}
