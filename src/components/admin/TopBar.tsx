'use client'

import React from 'react'
import Link from 'next/link'
import { Bell, ExternalLink, Menu } from 'lucide-react'
import { useUIStore } from '@/store/ui'
import { getInitials } from '@/lib/utils'

interface TopBarProps {
  title: string
  userName?: string
  userEmail?: string
  actions?: React.ReactNode
}

export function TopBar({ title, userName = 'Admin', userEmail, actions }: TopBarProps) {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {actions && <div className="hidden sm:block">{actions}</div>}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <ExternalLink className="w-4 h-4" />
          Ver Loja
        </Link>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {getInitials(userName)}
          </div>
          {userEmail && (
            <div className="hidden md:block">
              <p className="text-xs font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
