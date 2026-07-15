'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  data: any
}

export function GeneralTab({ data }: Props) {
  const [form, setForm] = useState({
    companyName: data?.companyName ?? '',
    logo: data?.logo ?? '',
    phone: data?.phone ?? '',
    whatsapp: data?.whatsapp ?? '',
    email: data?.email ?? '',
    website: data?.website ?? '',
    address: data?.address ?? '',
    city: data?.city ?? '',
    province: data?.province ?? '',
    country: data?.country ?? 'Angola',
    nif: data?.nif ?? '',
    currency: data?.currency ?? 'AOA',
    dateFormat: data?.dateFormat ?? 'DD/MM/YYYY',
    timeFormat: data?.timeFormat ?? 'HH:mm',
    timezone: data?.timezone ?? 'Africa/Luanda',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setToast({ type: 'success', message: 'Configurações guardadas com sucesso!' })
    } catch {
      setToast({ type: 'error', message: 'Erro ao guardar configurações.' })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Identity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Identidade da Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nome da Empresa</Label>
            <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label>Logótipo</Label>
            <div className="mt-1">
              <ImageUpload
                value={form.logo}
                onChange={(url) => set('logo', url)}
                placeholder="URL do logótipo..."
                folder="vn-commerce/settings"
              />
            </div>
          </div>
          <div>
            <Label>NIF</Label>
            <Input value={form.nif} onChange={(e) => set('nif', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => set('website', e.target.value)} className="mt-1" placeholder="https://" />
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Contactos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1" placeholder="+244 ..." />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} className="mt-1" placeholder="+244 ..." />
          </div>
          <div className="md:col-span-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} className="mt-1" type="email" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Morada</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Província</Label>
            <Input value={form.province} onChange={(e) => set('province', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>País</Label>
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Regional */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Regional</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Moeda</Label>
            <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AOA">AOA - Kwanza</SelectItem>
                <SelectItem value="USD">USD - Dólar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Formato de Data</Label>
            <Select value={form.dateFormat} onValueChange={(v) => set('dateFormat', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Formato de Hora</Label>
            <Select value={form.timeFormat} onValueChange={(v) => set('timeFormat', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HH:mm">24h (HH:mm)</SelectItem>
                <SelectItem value="hh:mm a">12h (hh:mm a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label>Fuso Horário</Label>
            <Select value={form.timezone} onValueChange={(v) => set('timezone', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Luanda">Africa/Luanda (WAT +1)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/Lisbon">Europe/Lisbon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Configurações
        </Button>
      </div>
    </div>
  )
}
