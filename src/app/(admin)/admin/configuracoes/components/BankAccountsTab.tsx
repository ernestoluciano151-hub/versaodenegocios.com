'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit2, Trash2, Loader2, CheckCircle, AlertCircle, Landmark } from 'lucide-react'

const EMPTY = { type: 'transfer', bankName: '', accountHolder: '', iban: '', nib: '', accountNumber: '', swift: '', currency: 'AOA', country: 'Angola', active: true, notes: '' }

interface Props {
  bankAccounts: any[]
}

export function BankAccountsTab({ bankAccounts: initial }: Props) {
  const [accounts, setAccounts] = useState(initial)
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function setField(k: string, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }))
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(acc: any) {
    setEditing(acc)
    setForm({ type: acc.type, bankName: acc.bankName, accountHolder: acc.accountHolder, iban: acc.iban ?? '', nib: acc.nib ?? '', accountNumber: acc.accountNumber ?? '', swift: acc.swift ?? '', currency: acc.currency, country: acc.country, active: acc.active, notes: acc.notes ?? '' })
    setOpen(true)
  }

  async function handleSave() {
    setLoading(true)
    try {
      if (editing) {
        const res = await fetch(`/api/admin/bank-accounts/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAccounts((a) => a.map((x) => (x.id === editing.id ? { ...x, ...data } : x)))
      } else {
        const res = await fetch('/api/admin/bank-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAccounts((a) => [...a, data])
      }
      setOpen(false)
      showToast('success', editing ? 'Conta actualizada.' : 'Conta criada.')
    } catch {
      showToast('error', 'Erro ao guardar conta.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/bank-accounts/${editing.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAccounts((a) => a.filter((x) => x.id !== editing.id))
      setDeleteOpen(false)
      showToast('success', 'Conta eliminada.')
    } catch {
      showToast('error', 'Erro ao eliminar conta.')
    } finally {
      setLoading(false)
    }
  }

  const transfers = accounts.filter((a) => a.type === 'transfer')
  const deposits = accounts.filter((a) => a.type === 'deposit')

  function AccountRow({ acc }: { acc: any }) {
    return (
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
          <Landmark className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{acc.bankName}</p>
          <p className="text-xs text-gray-400">{acc.accountHolder} • {acc.currency}</p>
          {(acc.iban || acc.nib) && <p className="text-xs text-gray-300 font-mono">{acc.iban || acc.nib}</p>}
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${acc.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{acc.active ? 'Activa' : 'Inactiva'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(acc)}><Edit2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { setEditing(acc); setDeleteOpen(true) }}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={openNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2" size="sm">
          <Plus className="w-4 h-4" />Nova Conta
        </Button>
      </div>

      {/* Transfers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Transferência</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {transfers.map((a) => <AccountRow key={a.id} acc={a} />)}
          {transfers.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">Nenhuma conta de transferência.</p>}
        </div>
      </div>

      {/* Deposits */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Depósito</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {deposits.map((a) => <AccountRow key={a.id} acc={a} />)}
          {deposits.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">Nenhuma conta de depósito.</p>}
        </div>
      </div>

      {/* Save/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Conta' : 'Nova Conta Bancária'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setField('type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transferência</SelectItem>
                  <SelectItem value="deposit">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Banco</Label><Input className="mt-1" value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} /></div>
            <div><Label>Titular</Label><Input className="mt-1" value={form.accountHolder} onChange={(e) => setField('accountHolder', e.target.value)} /></div>
            <div><Label>IBAN</Label><Input className="mt-1" value={form.iban} onChange={(e) => setField('iban', e.target.value)} /></div>
            <div><Label>NIB</Label><Input className="mt-1" value={form.nib} onChange={(e) => setField('nib', e.target.value)} /></div>
            <div><Label>Nº de Conta</Label><Input className="mt-1" value={form.accountNumber} onChange={(e) => setField('accountNumber', e.target.value)} /></div>
            <div><Label>SWIFT/BIC</Label><Input className="mt-1" value={form.swift} onChange={(e) => setField('swift', e.target.value)} /></div>
            <div>
              <Label>Moeda</Label>
              <Select value={form.currency} onValueChange={(v) => setField('currency', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AOA">AOA</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>País</Label><Input className="mt-1" value={form.country} onChange={(e) => setField('country', e.target.value)} /></div>
            <div className="col-span-2">
              <Label>Notas</Label>
              <Textarea className="mt-1" rows={2} value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="acc-active" checked={form.active} onCheckedChange={(c) => setField('active', !!c)} />
              <Label htmlFor="acc-active">Conta activa</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? 'Guardar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar Conta</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">Tem a certeza que deseja eliminar a conta do <strong>{editing?.bankName}</strong>?</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button onClick={handleDelete} disabled={loading} variant="destructive">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
