'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'

export function SearchInput({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    startTransition(() => {
      router.push(`/pesquisa?q=${encodeURIComponent(q)}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Pesquisar produtos, marcas..."
        className="w-full pl-12 pr-14 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 shadow-sm"
        autoFocus
      />
      <button
        type="submit"
        disabled={isPending || value.trim().length < 2}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pesquisar'}
      </button>
    </form>
  )
}
