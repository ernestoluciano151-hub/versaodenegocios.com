'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/conta/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }) })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erro ao enviar email')
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Recuperar palavra-passe</h1>
          <p className="text-gray-500 mt-1">Enviamos um link para o seu email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="font-semibold text-gray-900">Email enviado!</h2>
              <p className="text-sm text-gray-500">
                Se o endereço <strong>{email}</strong> estiver registado, receberá um link para redefinir a palavra-passe. Verifique também a pasta de spam.
              </p>
              <Link href="/conta/login">
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}
              <div>
                <Label htmlFor="email">Email da sua conta</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="o.seu@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enviar link de recuperação
              </Button>
              <Link href="/conta/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-3 h-3 inline mr-1" />Voltar ao login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
