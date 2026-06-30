'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react'

interface Supplier { id: string; name: string }

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  currency: string
  date: string
  supplierId: string | null
  receipt: string | null
  createdAt: string
  supplier: { name: string } | null
}

const CATEGORIES = ['Importação', 'Logística', 'Salários', 'Aluguer', 'Manutenção', 'Marketing', 'Outros']
const CURRENCIES = ['AOA', 'USD', 'EUR']

const emptyForm = { category: 'Outros', description: '', amount: '', currency: 'AOA', date: '', supplierId: '', notes: '' }

export function ExpenseManager({ initialExpenses, suppliers }: { initialExpenses: Expense[]; suppliers: Supplier[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openNew() {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) })
    setEditId(null); setShowForm(true); setError(null)
  }

  function openEdit(e: Expense) {
    setForm({
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      currency: e.currency,
      date: e.date.slice(0, 10),
      supplierId: e.supplierId ?? '',
      notes: e.receipt ?? '',
    })
    setEditId(e.id); setShowForm(true); setError(null)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setError(null) }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload = { category: form.category, description: form.description, amount: Number(form.amount), currency: form.currency, date: form.date, supplierId: form.supplierId || null, notes: form.notes || null }
      let res: Response
      if (editId) {
        res = await fetch(`/api/admin/expenses/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/admin/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao guardar') }
      const saved: Expense = await res.json()
      if (editId) { setExpenses(prev => prev.map(x => x.id === editId ? saved : x)) }
      else { setExpenses(prev => [saved, ...prev]) }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally { setSaving(false) }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Tem a certeza que quer eliminar esta despesa?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' })
      setExpenses(prev => prev.filter(e => e.id !== id))
    } finally { setDeletingId(null) }
  }

  const fmt = (n: number, currency = 'AOA') =>
    Number(n).toLocaleString('pt-AO', { style: 'currency', currency, minimumFractionDigits: 0 })

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Despesas</h2>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="w-4 h-4" /> Nova Despesa
        </Button>
      </div>

      {showForm && (
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">{editId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
            <button onClick={cancelForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label>Categoria *</Label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da despesa" />
            </div>
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <Label>Valor *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min={0} step="0.01" />
            </div>
            <div>
              <Label>Moeda</Label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Fornecedor <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                <option value="">Nenhum</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <Label>Notas <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observações..." />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editId ? 'Actualizar' : 'Registar Despesa'}
            </Button>
            <Button variant="outline" onClick={cancelForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Categoria</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Descrição</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Fornecedor</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Valor</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{e.category}</span>
                </td>
                <td className="py-3 px-4 font-medium text-gray-800 max-w-[200px] truncate">{e.description}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{e.supplier?.name ?? '—'}</td>
                <td className="py-3 px-4 font-semibold text-red-500">-{fmt(Number(e.amount), e.currency)}</td>
                <td className="py-3 px-4 text-xs text-gray-400">{new Date(e.date).toLocaleDateString('pt-AO')}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteExpense(e.id)} disabled={deletingId === e.id} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Eliminar">
                      {deletingId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Sem despesas registadas.</div>
        )}
      </div>
    </div>
  )
}
