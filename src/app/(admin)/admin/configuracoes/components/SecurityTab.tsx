'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Shield } from 'lucide-react'

interface Props {
  auditLogs: any[]
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-gray-100 text-gray-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
}

function formatDate(d: any) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function SecurityTab({ auditLogs }: Props) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)

  const PAGE_SIZE = 20

  const uniqueActions = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.action))
    return ['all', ...Array.from(set)]
  }, [auditLogs])

  const filtered = useMemo(() => {
    if (filter === 'all') return auditLogs
    return auditLogs.filter((l) => l.action === filter)
  }, [auditLogs, filter])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  function toggle(id: string) {
    setExpanded((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Registos de Auditoria</h2>
            <span className="text-xs text-gray-400">({filtered.length} registos)</span>
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0) }}>
            <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a}>{a === 'all' ? 'Todas as acções' : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-8" />
                <TableHead className="text-xs uppercase text-gray-500">Utilizador</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Acção</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Entidade</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">ID</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">IP</TableHead>
                <TableHead className="text-xs uppercase text-gray-500">Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((log) => {
                const isExpanded = expanded.has(log.id)
                const hasData = log.oldData || log.newData
                return (
                  <>
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="py-2">
                        {hasData && (
                          <button onClick={() => toggle(log.id)} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-sm font-medium text-gray-900">{log.user?.name ?? 'Sistema'}</p>
                        <p className="text-xs text-gray-400">{log.user?.email}</p>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-sm text-gray-700">{log.entity}</TableCell>
                      <TableCell className="py-2 text-xs font-mono text-gray-400">{log.entityId?.slice(0, 8)}...</TableCell>
                      <TableCell className="py-2 text-xs text-gray-500">{log.ip ?? '—'}</TableCell>
                      <TableCell className="py-2 text-xs text-gray-500">{formatDate(log.createdAt)}</TableCell>
                    </TableRow>
                    {isExpanded && hasData && (
                      <TableRow key={`${log.id}-expanded`}>
                        <TableCell colSpan={7} className="bg-gray-50 py-3 px-5">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {log.oldData && (
                              <div>
                                <p className="font-semibold text-gray-500 mb-1">Antes</p>
                                <pre className="bg-white border border-gray-200 rounded-lg p-3 overflow-auto text-gray-700 text-xs max-h-40">{JSON.stringify(log.oldData, null, 2)}</pre>
                              </div>
                            )}
                            {log.newData && (
                              <div>
                                <p className="font-semibold text-gray-500 mb-1">Depois</p>
                                <pre className="bg-white border border-gray-200 rounded-lg p-3 overflow-auto text-gray-700 text-xs max-h-40">{JSON.stringify(log.newData, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-10">
                    Nenhum registo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Página {page + 1} de {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
