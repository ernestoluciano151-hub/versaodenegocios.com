'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit2, Trash2, Key, Loader2, CheckCircle, AlertCircle, UserCircle } from 'lucide-react'

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCIAL_MANAGER', label: 'Gestor Financeiro' },
  { value: 'SALES_MANAGER', label: 'Gestor de Vendas' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SUPPORT', label: 'Suporte' },
  { value: 'WAREHOUSE', label: 'Armazém' },
  { value: 'OPERATOR', label: 'Operador' },
]

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  FINANCIAL_MANAGER: 'bg-green-100 text-green-700',
  SALES_MANAGER: 'bg-blue-100 text-blue-700',
  MARKETING: 'bg-purple-100 text-purple-700',
  SUPPORT: 'bg-cyan-100 text-cyan-700',
  WAREHOUSE: 'bg-yellow-100 text-yellow-700',
  OPERATOR: 'bg-gray-100 text-gray-700',
}

function roleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function formatDate(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '', role: 'OPERATOR', department: '', active: true }

interface Props {
  users: any[]
}

export function UsersTab({ users: initial }: Props) {
  const [users, setUsers] = useState(initial)
  const [newOpen, setNewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [newPwd, setNewPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function setField(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleCreate() {
    if (form.password !== form.confirmPassword) return showToast('error', 'As palavras-passe não coincidem.')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers((u) => [...u, data])
      setNewOpen(false)
      setForm(EMPTY_FORM)
      showToast('success', 'Utilizador criado com sucesso.')
    } catch {
      showToast('error', 'Erro ao criar utilizador.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, role: form.role, department: form.department, active: form.active }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers((u) => u.map((x) => (x.id === selected.id ? { ...x, ...data } : x)))
      setEditOpen(false)
      showToast('success', 'Utilizador actualizado.')
    } catch {
      showToast('error', 'Erro ao actualizar utilizador.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd }),
      })
      if (!res.ok) throw new Error()
      setPwdOpen(false)
      setNewPwd('')
      showToast('success', 'Palavra-passe redefinida.')
    } catch {
      showToast('error', 'Erro ao redefinir palavra-passe.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsers((u) => u.filter((x) => x.id !== selected.id))
      setDeleteOpen(false)
      showToast('success', 'Utilizador eliminado.')
    } catch {
      showToast('error', 'Erro ao eliminar utilizador.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(user: any) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      if (!res.ok) throw new Error()
      setUsers((u) => u.map((x) => (x.id === user.id ? { ...x, active: !user.active } : x)))
    } catch {
      showToast('error', 'Erro ao actualizar estado.')
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Utilizadores ({users.length})</h2>
          <Button onClick={() => { setForm(EMPTY_FORM); setNewOpen(true) }} className="bg-orange-500 hover:bg-orange-600 text-white gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Novo Utilizador
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs uppercase text-gray-500">Utilizador</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Papel</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Departamento</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Estado</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Último Login</TableHead>
                <TableHead className="text-xs uppercase text-gray-500 text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-semibold flex items-center justify-center text-sm">
                        {getInitials(u.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {roleLabel(u.role)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{u.department ?? '—'}</TableCell>
                  <TableCell>
                    <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(u.lastLoginAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(u); setForm({ name: u.name, email: u.email, password: '', confirmPassword: '', role: u.role, department: u.department ?? '', active: u.active }); setEditOpen(true) }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setSelected(u); setNewPwd(''); setPwdOpen(true) }}>
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { setSelected(u); setDeleteOpen(true) }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Nenhum utilizador encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* New User Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Utilizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input className="mt-1" value={form.name} onChange={(e) => setField('name', e.target.value)} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></div>
            <div><Label>Palavra-passe</Label><Input className="mt-1" type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} /></div>
            <div><Label>Confirmar Palavra-passe</Label><Input className="mt-1" type="password" value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} /></div>
            <div>
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(v) => setField('role', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Departamento</Label><Input className="mt-1" value={form.department} onChange={(e) => setField('department', e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <Checkbox id="active-new" checked={form.active} onCheckedChange={(c) => setField('active', !!c)} />
              <Label htmlFor="active-new">Activo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Utilizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome</Label><Input className="mt-1" value={form.name} onChange={(e) => setField('name', e.target.value)} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} /></div>
            <div>
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(v) => setField('role', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Departamento</Label><Input className="mt-1" value={form.department} onChange={(e) => setField('department', e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <Checkbox id="active-edit" checked={form.active} onCheckedChange={(c) => setField('active', !!c)} />
              <Label htmlFor="active-edit">Activo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redefinir Palavra-passe</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-500 mb-4">Nova palavra-passe para <strong>{selected?.name}</strong></p>
            <Label>Nova Palavra-passe</Label>
            <Input className="mt-1" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPwdOpen(false)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={loading || !newPwd} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Redefinir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar Utilizador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">Tem a certeza que deseja eliminar <strong>{selected?.name}</strong>? Esta acção não pode ser revertida.</p>
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
