'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { DollarSign, ArrowUp, ArrowDown, Package } from 'lucide-react'

interface FinanceiroStatsProps {
  faturamento: number
  entradas: number
  saidas: number
  estoque: number
}

export function FinanceiroStats({ faturamento, entradas, saidas, estoque }: FinanceiroStatsProps) {
  const stats = [
    {
      label: 'Faturamento',
      value: formatCurrency(faturamento),
      icon: DollarSign,
      color: 'text-foreground',
      iconColor: 'text-muted-foreground',
    },
    {
      label: 'Entradas',
      value: formatCurrency(entradas),
      icon: ArrowUp,
      color: 'text-foreground',
      iconColor: 'text-success',
      arrow: 'up',
    },
    {
      label: 'Saídas',
      value: formatCurrency(saidas),
      icon: ArrowDown,
      color: 'text-foreground',
      iconColor: 'text-destructive',
      arrow: 'down',
    },
    {
      label: 'Estoque',
      value: formatCurrency(estoque),
      icon: Package,
      color: 'text-foreground',
      iconColor: 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            {stat.arrow && (
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            )}
            {!stat.arrow && stat.label === 'Estoque' && (
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
