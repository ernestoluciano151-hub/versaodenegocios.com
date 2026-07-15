'use client'
import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'

export function MobileMenuButton() {
  const { openMobileMenu } = useUIStore()
  return (
    <button
      onClick={openMobileMenu}
      className="flex lg:hidden items-center gap-2 p-2 bg-orange-500 text-white rounded-lg"
      aria-label="Abrir menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
