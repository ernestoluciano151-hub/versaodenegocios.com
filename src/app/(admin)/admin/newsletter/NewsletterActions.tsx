'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Trash2 } from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  name: string | null
  active: boolean
  createdAt: string
}

interface Props {
  subscribers: Subscriber[]
}

export function ExportCSVButton({ subscribers }: Props) {
  const handleExport = () => {
    const header = 'Email,Nome,Activo,Data de Subscrição'
    const rows = subscribers.map((s) =>
      [
        `"${s.email}"`,
        `"${s.name ?? ''}"`,
        s.active ? 'Sim' : 'Não',
        new Date(s.createdAt).toLocaleDateString('pt-AO'),
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="w-4 h-4" />
      Exportar CSV
    </Button>
  )
}

export function RemoveButton({ id }: { id: string }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirm('Remover subscritor?')) return
    setRemoving(true)
    try {
      await fetch(`/api/newsletter/${id}`, { method: 'DELETE' })
      window.location.reload()
    } catch {
      setRemoving(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleRemove} disabled={removing}>
      <Trash2 className="w-4 h-4 text-red-400" />
    </Button>
  )
}
