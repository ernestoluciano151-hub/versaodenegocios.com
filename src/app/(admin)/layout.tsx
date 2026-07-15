import type { Metadata } from 'next'
import { Sidebar } from '@/components/admin/Sidebar'
import { MobileSidebar } from '@/components/admin/MobileSidebar'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: { default: 'Admin — VN Commerce', template: '%s | Admin VN Commerce' },
  robots: 'noindex,nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar />
        <MobileSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </ToastProvider>
  )
}
