import { cn, formatCurrency } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  currency?: boolean
  className?: string
}

export function StatsCard({ title, value, change, icon: Icon, currency, className }: StatsCardProps) {
  const displayValue = currency && typeof value === 'number' ? formatCurrency(value) : value

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{displayValue}</p>
          {change !== undefined && (
            <p className={cn('text-xs mt-1', change >= 0 ? 'text-green-600' : 'text-red-600')}>
              {change >= 0 ? '+' : ''}{change}% vs. mês anterior
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-orange-500" />
        </div>
      </div>
    </div>
  )
}
