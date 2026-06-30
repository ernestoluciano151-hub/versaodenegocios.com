export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { ImportManager } from './ImportManager'

export default async function ImportacoesPage() {
  const [imports, suppliers] = await Promise.all([
    prisma.import.findMany({
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { name: true, country: true } } },
      take: 100,
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, country: true } }),
  ])

  const importsData = imports.map(imp => ({
    ...imp,
    totalCost: Number(imp.totalCost),
    shippingCost: Number(imp.shippingCost),
    customsDuty: Number(imp.customsDuty),
    otherCosts: Number(imp.otherCosts),
    totalLanded: Number(imp.totalLanded),
    estimatedArrival: imp.estimatedArrival ? imp.estimatedArrival.toISOString() : null,
    actualArrival: imp.actualArrival ? imp.actualArrival.toISOString() : null,
    createdAt: imp.createdAt.toISOString(),
    updatedAt: imp.updatedAt.toISOString(),
    products: imp.products,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Importações" />
      <div className="flex-1 overflow-y-auto p-6">
        <ImportManager initialImports={importsData} suppliers={suppliers} />
      </div>
    </div>
  )
}
