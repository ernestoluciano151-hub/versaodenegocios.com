export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/admin/TopBar'
import { SupplierManager } from './SupplierManager'

export default async function FornecedoresPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { imports: true } } },
  })

  const suppliersData = suppliers.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Fornecedores" />
      <div className="flex-1 overflow-y-auto p-6">
        <SupplierManager initialSuppliers={suppliersData} />
      </div>
    </div>
  )
}
