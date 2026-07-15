'use client'

import { useState } from 'react'

interface Props {
  productId: string
  initialActive: boolean
}

export function VisibilityToggle({ productId, initialActive }: Props) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const next = !active
    try {
      const res = await fetch(`/api/admin/products/${productId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })
      if (res.ok) setActive(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={active ? 'Clique para desactivar' : 'Clique para activar'}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
        active ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          active ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
