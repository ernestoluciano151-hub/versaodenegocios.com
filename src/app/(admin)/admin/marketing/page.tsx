export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { Mail, Users, Tag } from 'lucide-react'
import { CouponManager } from './CouponManager'
import { CampaignManager } from './CampaignManager'

export default async function MarketingPage() {
  const [campaigns, newsletterCount, coupons] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.newsletter.count({ where: { active: true } }),
    prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ])

  // Normalise Decimal fields to plain numbers for client components
  const couponsData = coupons.map(c => ({
    ...c,
    value: Number(c.value),
    minOrder: c.minOrder != null ? Number(c.minOrder) : null,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const campaignsData = campaigns.map(c => ({
    ...c,
    scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
    sentAt: c.sentAt ? c.sentAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Marketing" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Subscritores</span></div>
            <p className="text-2xl font-bold text-gray-900">{newsletterCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><Mail className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Campanhas</span></div>
            <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1"><Tag className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500">Cupões Activos</span></div>
            <p className="text-2xl font-bold text-gray-900">{coupons.filter(c => c.active).length}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <CampaignManager initialCampaigns={campaignsData} />
          <CouponManager initialCoupons={couponsData} />
        </div>
      </div>
    </div>
  )
}
