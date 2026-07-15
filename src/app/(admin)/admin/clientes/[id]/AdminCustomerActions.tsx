'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Ban, Lock, Unlock, Mail } from 'lucide-react'

interface Props {
  customerId: string
  email: string
  isSuspended: boolean
  isBanned: boolean
  isLoginBlocked: boolean
}

export function AdminCustomerActions({ customerId, email, isSuspended, isBanned, isLoginBlocked }: Props) {
  const [suspended, setSuspended] = useState(isSuspended)
  const [banned, setBanned] = useState(isBanned)
  const [loginBlocked, setLoginBlocked] = useState(isLoginBlocked)
  const [loading, setLoading] = useState<string | null>(null)

  async function doAction(action: string) {
    const messages: Record<string, string> = {
      suspend:        'Suspender este cliente?',
      unsuspend:      'Remover suspensão?',
      ban:            'Banir permanentemente este cliente?',
      unban:          'Remover banimento?',
      block_login:    'Bloquear o login deste cliente?',
      unblock_login:  'Desbloquear login deste cliente?',
    }
    if (!confirm(messages[action] ?? 'Confirmar acção?')) return

    setLoading(action)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        if (action === 'suspend')       setSuspended(true)
        if (action === 'unsuspend')     setSuspended(false)
        if (action === 'ban')           { setBanned(true); setSuspended(false) }
        if (action === 'unban')         setBanned(false)
        if (action === 'block_login')   setLoginBlocked(true)
        if (action === 'unblock_login') setLoginBlocked(false)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4" /> Acções Admin
      </h3>
      <div className="space-y-2">
        {/* Suspend / Unsuspend */}
        {!banned && (
          suspended ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs text-green-700 border-green-200 hover:bg-green-50"
              onClick={() => doAction('unsuspend')}
              disabled={!!loading}
            >
              <Unlock className="w-3.5 h-3.5 mr-2" />
              {loading === 'unsuspend' ? 'A processar...' : 'Remover Suspensão'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs text-yellow-700 border-yellow-200 hover:bg-yellow-50"
              onClick={() => doAction('suspend')}
              disabled={!!loading}
            >
              <Lock className="w-3.5 h-3.5 mr-2" />
              {loading === 'suspend' ? 'A processar...' : 'Suspender Cliente'}
            </Button>
          )
        )}

        {/* Ban / Unban */}
        {banned ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => doAction('unban')}
            disabled={!!loading}
          >
            <Unlock className="w-3.5 h-3.5 mr-2" />
            {loading === 'unban' ? 'A processar...' : 'Remover Banimento'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs text-red-700 border-red-200 hover:bg-red-50"
            onClick={() => doAction('ban')}
            disabled={!!loading}
          >
            <Ban className="w-3.5 h-3.5 mr-2" />
            {loading === 'ban' ? 'A processar...' : 'Banir Cliente'}
          </Button>
        )}

        {/* Block login / Unblock */}
        {loginBlocked ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => doAction('unblock_login')}
            disabled={!!loading}
          >
            <Unlock className="w-3.5 h-3.5 mr-2" />
            {loading === 'unblock_login' ? 'A processar...' : 'Desbloquear Login'}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
            onClick={() => doAction('block_login')}
            disabled={!!loading}
          >
            <Lock className="w-3.5 h-3.5 mr-2" />
            {loading === 'block_login' ? 'A processar...' : 'Bloquear Login'}
          </Button>
        )}

        {/* Email */}
        <a href={`mailto:${email}`}>
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <Mail className="w-3.5 h-3.5 mr-2" />
            Enviar Email
          </Button>
        </a>
      </div>
    </div>
  )
}
