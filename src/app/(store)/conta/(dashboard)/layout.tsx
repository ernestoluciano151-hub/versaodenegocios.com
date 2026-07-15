import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { CustomerSidebar } from '@/components/store/CustomerSidebar'
import { CustomerMobileDrawer } from '@/components/store/CustomerMobileDrawer'
import { MobileMenuButton } from '@/components/store/MobileMenuButton'

export default async function ContaDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession()
  if (!session) redirect('/conta/login')

  const customer = { name: session.name, email: session.email, image: session.image }

  return (
    <>
      <CustomerMobileDrawer customer={customer} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile navigation header */}
        <div className="flex lg:hidden items-center gap-3 mb-4">
          <MobileMenuButton />
          <h1 className="font-bold text-gray-900">Minha Conta</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <CustomerSidebar customer={customer} />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </>
  )
}
