'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Ocorreu um erro. Tente novamente.')
      } else {
        setStatus('success')
        setMessage(data.message ?? 'Subscrito com sucesso!')
        setEmail('')
      }
    } catch {
      setStatus('error')
      setMessage('Ocorreu um erro. Tente novamente.')
    }
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg px-6 py-4">
          <p className="font-medium">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="O seu email"
        required
        className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? 'A subscrever...' : 'Subscrever'}
      </button>
      {status === 'error' && (
        <p className="w-full text-sm text-red-400 text-center mt-1">{message}</p>
      )}
    </form>
  )
}
