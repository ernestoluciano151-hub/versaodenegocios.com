'use client'

import { useState } from 'react'
import { Eye, EyeOff, Settings, Package, BookOpen, Lock, Star, Archive, ChevronDown } from 'lucide-react'

type Visibility = 'visible' | 'hidden' | 'maintenance' | 'out_of_stock' | 'catalog_only' | 'members_only' | 'affiliates_only' | 'archived'

const OPTIONS: { value: Visibility; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'visible',        label: 'Visível na loja',         icon: Eye,        color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  { value: 'hidden',         label: 'Oculto da loja',          icon: EyeOff,     color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  { value: 'maintenance',    label: 'Em manutenção',           icon: Settings,   color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'out_of_stock',   label: 'Esgotado',                icon: Package,    color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  { value: 'catalog_only',   label: 'Apenas catálogo',         icon: BookOpen,   color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  { value: 'members_only',   label: 'Apenas registados',       icon: Lock,       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  { value: 'affiliates_only',label: 'Apenas afiliados',        icon: Star,       color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { value: 'archived',       label: 'Arquivado',               icon: Archive,    color: 'text-gray-400',   bg: 'bg-gray-100 border-gray-300' },
]

interface Props {
  productId: string
  initialVisibility: Visibility
}

export function VisibilitySelect({ productId, initialVisibility }: Props) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const current = OPTIONS.find(o => o.value === visibility) || OPTIONS[0]
  const Icon = current.icon

  async function change(val: Visibility) {
    setLoading(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/admin/products/${productId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: val }),
      })
      if (res.ok) setVisibility(val)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${current.bg} ${current.color}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{current.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-48">
          {OPTIONS.map(opt => {
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => change(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${opt.value === visibility ? 'font-semibold' : ''}`}
              >
                <OptIcon className={`w-4 h-4 ${opt.color}`} />
                <span className={opt.color}>{opt.label}</span>
                {opt.value === visibility && <span className="ml-auto text-orange-500">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
