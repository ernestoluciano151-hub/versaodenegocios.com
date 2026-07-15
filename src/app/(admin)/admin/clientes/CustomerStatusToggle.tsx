'use client'

import { useState } from 'react'

type Action = 'suspend' | 'unsuspend' | 'ban' | 'unban'

interface Props {
  customerId: string
  initialActive: boolean
  initialSuspended?: boolean
  initialBanned?: boolean
}

export function CustomerStatusToggle({ customerId, initialActive, initialSuspended = false, initialBanned = false }: Props) {
  const [active, setActive] = useState(initialActive)
  const [suspended, setSuspended] = useState(initialSuspended)
  const [banned, setBanned] = useState(initialBanned)
  const [loading, setLoading] = useState(false)

  async function doAction(action: Action) {
    const messages: Record<Action, string> = {
      suspend:   'Suspender este cliente?',
      unsuspend: 'Remover suspensão deste cliente?',
      ban:       'Banir este cliente? Esta acção é grave.',
      unban:     'Remover banimento deste cliente?',
    }
    if (!confirm(messages[action])) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        if (action === 'suspend')   { setSuspended(true); setActive(false) }
        if (action === 'unsuspend') { setSuspended(false); setActive(true) }
        if (action === 'ban')       { setBanned(true); setActive(false) }
        if (action === 'unban')     { setBanned(false); setActive(true) }
      }
    } finally {
      setLoading(false)
    }
  }

  if (banned) {
    return (
      <button
        onClick={() => doAction('unban')}
        disabled={loading}
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
        title="Clique para desbanir"
      >
        {loading ? '…' : 'Banido'}
      </button>
    )
  }

  if (suspended) {
    return (
      <button
        onClick={() => doAction('unsuspend')}
        disabled={loading}
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
        title="Clique para remover suspensão"
      >
        {loading ? '…' : 'Suspenso'}
      </button>
    )
  }

  if (active) {
    return (
      <button
        onClick={() => doAction('suspend')}
        disabled={loading}
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-50 transition-colors"
        title="Clique para suspender"
      >
        {loading ? '…' : 'Activo'}
      </button>
    )
  }

  return (
    <button
      onClick={() => doAction('unsuspend')}
      disabled={loading}
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200 disabled:opacity-50 transition-colors"
      title="Clique para activar"
    >
      {loading ? '…' : 'Inactivo'}
    </button>
  )
}
