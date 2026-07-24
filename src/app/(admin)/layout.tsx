import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/admin/Sidebar'
import { MobileSidebar } from '@/components/admin/MobileSidebar'
import { ToastProvider } from '@/components/ui/toast'
import type { PermissionMap } from '@/lib/permissions'

export const metadata: Metadata = {
  title: { default: 'Admin — VN Commerce', template: '%s | Admin VN Commerce' },
  robots: 'noindex,nofollow',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as { role?: string; permissions?: PermissionMap } | null
  const role = user?.role ?? ''
  const permissions = user?.permissions ?? {}

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar role={role} permissions={permissions} />
        <MobileSidebar role={role} permissions={permissions} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </ToastProvider>
  )
}
