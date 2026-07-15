'use client'

import { useState } from 'react'

interface Props {
  customerId: string
  initialActive: boolean
}

export function CustomerStatusToggle({ customerId, initialActive }: Props) {
  const [active, setActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!confirm(active ? 'Bloquear este cliente?' : 'Desbloquear este cliente?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      })
      if (res.ok) setActive(!active)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
        active
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
          : 'bg-red-50 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
      }`}
      title={active ? 'Clique para bloquear' : 'Clique para desbloquear'}
    >
      {loading ? '…' : active ? 'Activo' : 'Bloqueado'}
    </button>
  )
}
