'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BankAccount {
  id: string; bankName: string; label: string; holder: string
  iban?: string; nib?: string; account?: string; swift?: string; notes?: string
  active: boolean; order: number
}

const PRESET_BANKS = [
  { bankName: 'BCS', label: 'Banco de Crédito do Sul' },
  { bankName: 'BAI', label: 'Banco Angolano de Investimentos' },
  { bankName: 'BCI', label: 'Banco de Comércio e Indústria' },
  { bankName: 'BFA', label: 'Banco de Fomento Angola' },
  { bankName: 'OUTRO', label: 'Outro Banco' },
]

const empty = { bankName: '', label: '', holder: '', iban: '', nib: '', account: '', swift: '', notes: '' }

export default function CoordenadasBancariasPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BankAccount | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/bank-accounts')
    if (res.ok) setAccounts(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(a: BankAccount) {
    setEditing(a)
    setForm({ bankName: a.bankName, label: a.label, holder: a.holder, iban: a.iban ?? '', nib: a.nib ?? '', account: a.account ?? '', swift: a.swift ?? '', notes: a.notes ?? '' })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const url = editing ? `/api/admin/bank-accounts/${editing.id}` : '/api/admin/bank-accounts'
    const method = editing ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    await load()
    setShowForm(false)
    setSaving(false)
  }

  async function toggle(a: BankAccount) {
    await fetch(`/api/admin/bank-accounts/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !a.active }) })
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Eliminar esta conta bancária?')) return
    await fetch(`/api/admin/bank-accounts/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordenadas Bancárias</h1>
          <p className="text-sm text-gray-500 mt-1">Contas bancárias disponíveis para transferência no checkout</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Adicionar Banco</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">A carregar...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Nenhuma conta bancária configurada.</p>
          <Button onClick={openNew}><Plus className="w-4 h-4" /> Adicionar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => (
            <div key={a.id} className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-4 ${a.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{a.label}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.bankName}</span>
                    {!a.active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactivo</span>}
                  </div>
                  <p className="text-sm text-gray-500">Titular: {a.holder}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400 font-mono">
                    {a.iban && <span>IBAN: {a.iban}</span>}
                    {a.nib && <span>NIB: {a.nib}</span>}
                    {a.account && <span>Conta: {a.account}</span>}
                    {a.swift && <span>SWIFT: {a.swift}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle(a)} title={a.active ? 'Desactivar' : 'Activar'} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  {a.active ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer / Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">{editing ? 'Editar Banco' : 'Adicionar Banco'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Preset */}
              {!editing && (
                <div>
                  <Label>Banco (preset)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_BANKS.map((b) => (
                      <button key={b.bankName} type="button"
                        onClick={() => setForm(f => ({ ...f, bankName: b.bankName, label: b.label }))}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${form.bankName === b.bankName ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                      >{b.bankName}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código do Banco *</Label>
                  <Input className="mt-1" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} placeholder="ex: BAI" />
                </div>
                <div>
                  <Label>Nome do Banco *</Label>
                  <Input className="mt-1" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="ex: Banco Angolano de Investimentos" />
                </div>
              </div>
              <div>
                <Label>Titular da Conta *</Label>
                <Input className="mt-1" value={form.holder} onChange={e => setForm(f => ({ ...f, holder: e.target.value }))} placeholder="Nome do titular" />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input className="mt-1 font-mono" value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="AO06 0000 0000 0000 0000 0000 0" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>NIB</Label>
                  <Input className="mt-1 font-mono" value={form.nib} onChange={e => setForm(f => ({ ...f, nib: e.target.value }))} placeholder="0000 0000 0000 0000 0" />
                </div>
                <div>
                  <Label>Nº de Conta</Label>
                  <Input className="mt-1 font-mono" value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} placeholder="00000000000" />
                </div>
              </div>
              <div>
                <Label>SWIFT / BIC</Label>
                <Input className="mt-1 font-mono" value={form.swift} onChange={e => setForm(f => ({ ...f, swift: e.target.value }))} placeholder="BAIAAOLU" />
              </div>
              <div>
                <Label>Instruções adicionais</Label>
                <Input className="mt-1" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ex: Indicar número do pedido na referência" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button className="flex-1" loading={saving} onClick={save}>
                {editing ? 'Guardar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
