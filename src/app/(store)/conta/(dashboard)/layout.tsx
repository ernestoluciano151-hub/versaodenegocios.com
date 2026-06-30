import { redirect } from 'next/navigation'
import { getCustomerSession } from '@/lib/customer-auth'
import { CustomerSidebar } from '@/components/store/CustomerSidebar'

export default async function ContaDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession()
  if (!session) redirect('/conta/login')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <CustomerSidebar customer={{ name: session.name, email: session.email, image: session.image }} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
