'use client'
import { useEffect, useState } from 'react'
import { User, Lock, Bell, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface Profile {
  id: string; name: string; email: string; phone: string | null
  avatar: string | null; nif: string | null; createdAt: string
  prefEmails: boolean; prefPromos: boolean; prefNotifications: boolean
}

export default function ContaPerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', nif: '' })
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [prefs, setPrefs] = useState({ emails: true, promos: true, notifications: true })
  const [savingPrefs, setSavingPrefs] = useState(false)

  async function load() {
    const res = await fetch('/api/conta/profile')
    if (res.ok) {
      const data: Profile = await res.json()
      setProfile(data)
      setForm({ name: data.name, phone: data.phone ?? '', nif: data.nif ?? '' })
      setPrefs({ emails: data.prefEmails, promos: data.prefPromos, notifications: data.prefNotifications })
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(msg: string, type: 'ok' | 'err') {
    if (type === 'ok') { setSuccessMsg(msg); setErrorMsg('') }
    else { setErrorMsg(msg); setSuccessMsg('') }
    setTimeout(() => { setSuccessMsg(''); setErrorMsg('') }, 4000)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    const res = await fetch('/api/conta/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) { flash('Perfil actualizado com sucesso!', 'ok'); await load() }
    else flash('Erro ao guardar perfil.', 'err')
    setSavingProfile(false)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw.new !== pw.confirm) { flash('As palavras-passe não coincidem.', 'err'); return }
    if (pw.new.length < 6) { flash('A nova palavra-passe deve ter pelo menos 6 caracteres.', 'err'); return }
    setSavingPw(true)
    const res = await fetch('/api/conta/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.new }),
    })
    if (res.ok) { flash('Palavra-passe alterada com sucesso!', 'ok'); setPw({ current: '', new: '', confirm: '' }) }
    else { const d = await res.json(); flash(d.error ?? 'Erro ao alterar palavra-passe.', 'err') }
    setSavingPw(false)
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
  if (!profile) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">O Meu Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerir os seus dados pessoais e segurança</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{errorMsg}</div>
      )}

      {/* Personal info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-orange-500" /> Dados Pessoais
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled className="mt-1 bg-gray-50 text-gray-400" />
              <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado</p>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+244 9XX XXX XXX" className="mt-1" />
            </div>
            <div>
              <Label>NIF</Label>
              <Input value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} placeholder="Número de Identificação Fiscal" className="mt-1" />
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-3">Cliente desde {new Date(profile.createdAt).toLocaleDateString('pt-AO', { dateStyle: 'long' })}</p>
            <Button type="submit" disabled={savingProfile} className="bg-orange-500 hover:bg-orange-600">
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Guardar alterações
            </Button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-orange-500" /> Segurança
        </h2>
        <form onSubmit={savePassword} className="space-y-4 max-w-md">
          <div>
            <Label>Palavra-passe actual</Label>
            <div className="relative mt-1">
              <Input type={showPw ? 'text' : 'password'} value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} required />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Nova palavra-passe</Label>
            <Input type="password" value={pw.new} onChange={e => setPw(p => ({ ...p, new: e.target.value }))} placeholder="Min. 6 caracteres" required className="mt-1" />
          </div>
          <div>
            <Label>Confirmar nova palavra-passe</Label>
            <Input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required className="mt-1" />
          </div>
          <Button type="submit" disabled={savingPw} className="bg-orange-500 hover:bg-orange-600">
            {savingPw && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Alterar palavra-passe
          </Button>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-orange-500" /> Preferências
        </h2>
        <div className="space-y-4">
          {[
            { key: 'emails', label: 'Receber emails sobre pedidos', desc: 'Confirmações e actualizações de estado', apiKey: 'prefEmails' },
            { key: 'promos', label: 'Receber promoções e ofertas', desc: 'Descontos exclusivos e campanhas', apiKey: 'prefPromos' },
            { key: 'notifications', label: 'Notificações da plataforma', desc: 'Alertas e novidades na conta', apiKey: 'prefNotifications' },
          ].map(({ key, label, desc, apiKey }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <Switch
                checked={prefs[key as keyof typeof prefs]}
                disabled={savingPrefs}
                onCheckedChange={async (v) => {
                  // Optimistic update
                  setPrefs(p => ({ ...p, [key]: v }))
                  setSavingPrefs(true)
                  try {
                    const res = await fetch('/api/conta/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ [apiKey]: v }),
                    })
                    if (!res.ok) {
                      // Rollback on failure
                      setPrefs(p => ({ ...p, [key]: !v }))
                      flash('Erro ao guardar preferências.', 'err')
                    }
                  } catch {
                    setPrefs(p => ({ ...p, [key]: !v }))
                    flash('Erro ao guardar preferências.', 'err')
                  } finally {
                    setSavingPrefs(false)
                  }
                }}
              />
            </div>
          ))}
        </div>
        {savingPrefs && <p className="text-xs text-orange-500 mt-3 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> A guardar preferências…</p>}
      </div>
    </div>
  )
}
