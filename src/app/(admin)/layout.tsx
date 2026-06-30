import type { Metadata } from 'next'
import { Sidebar } from '@/components/admin/Sidebar'

export const metadata: Metadata = {
  title: { default: 'Admin — VN Tech', template: '%s | Admin VN Tech' },
  robots: 'noindex,nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
