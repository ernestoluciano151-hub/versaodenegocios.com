'use client'
import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function RedefinirForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-600 font-medium">Link inválido.</p>
        <Link href="/conta/recuperar-password" className="text-orange-500 hover:underline text-sm">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As palavras-passe não coincidem.'); return }
    if (password.length < 8) { setError('A palavra-passe deve ter pelo menos 8 caracteres.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/conta/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Erro ao redefinir')
      setDone(true)
      setTimeout(() => router.push('/conta/login'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        <h2 className="font-semibold text-gray-900">Palavra-passe alterada!</h2>
        <p className="text-sm text-gray-500">A redirecionar para o login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}
      <div>
        <Label htmlFor="password">Nova palavra-passe</Label>
        <div className="relative mt-1">
          <Input
            id="password"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
          />
          <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <Label htmlFor="confirm">Confirmar palavra-passe</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repita a palavra-passe"
          required
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Redefinir palavra-passe
      </Button>
    </form>
  )
}

export default function RedefinirPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">VN Commerce</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nova palavra-passe</h1>
          <p className="text-gray-500 mt-1">Escolha uma palavra-passe segura</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <Suspense fallback={null}>
            <RedefinirForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
