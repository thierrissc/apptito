'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/formatters'

interface DashboardStatsProps {
  faturamento: number
  vendas: number
  lucroLiquido: number
  ticketMedio: number
}

export function DashboardStats({ faturamento, vendas, lucroLiquido, ticketMedio }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Faturamento',
      value: formatCurrency(faturamento),
      large: true,
    },
    {
      label: 'Vendas',
      value: `+${formatNumber(vendas)}`,
    },
    {
      label: 'Lucro Líquido',
      value: formatNumber(lucroLiquido),
    },
    {
      label: 'Ticket Méd',
      value: formatCurrency(ticketMedio).replace('R$', '').trim(),
    },
  ]

  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className={index === 0 ? 'col-span-2 sm:col-span-1' : ''}>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`font-bold ${stat.large ? 'text-3xl' : 'text-2xl'} text-foreground`}>
              {stat.large ? stat.value : stat.value}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
