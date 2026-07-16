'use client'
import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SocialLoginButtons } from '@/components/store/SocialLoginButtons'

export default function ContaRegistarPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('As palavras-passe não coincidem.'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/conta/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }) })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }
    // Auto-login after register
    await signIn('customer-credentials', { email: form.email, password: form.password, redirect: false })
    router.push('/conta')
    router.refresh()
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
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-gray-500 mt-1">Registe-se para acompanhar os seus pedidos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            <div>
              <Label>Nome completo</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="João Silva" required className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@email.com" required className="mt-1" />
            </div>
            <div>
              <Label>Telefone <span className="text-gray-400">(opcional)</span></Label>
              <Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+244 9XX XXX XXX" className="mt-1" />
            </div>
            <div>
              <Label>Palavra-passe</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caracteres" required className="mt-1" />
            </div>
            <div>
              <Label>Confirmar palavra-passe</Label>
              <Input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repetir palavra-passe" required className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Criar conta
            </Button>
          </form>
          <div className="mt-6">
            <SocialLoginButtons callbackUrl="/conta" label="registar" />
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link href="/conta/login" className="text-orange-500 hover:underline font-medium">Entrar</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
