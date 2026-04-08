'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

interface FinanceiroIndicadoresProps {
  cmv: number
  cmvPercent: string
  cmvStatus: string
  cmvDescription?: string
  despOperacionais: number
  despOperPercent: string
  despStatus: string
  impostos: number
  impostosPercent: string
  impostosStatus: string
  lucroLiquido: number
  lucroPercent: string
  lucroStatus: string
}

export function FinanceiroIndicadores({
  cmv,
  cmvPercent,
  cmvStatus,
  cmvDescription,
  despOperacionais,
  despOperPercent,
  despStatus,
  impostos,
  impostosPercent,
  impostosStatus,
  lucroLiquido,
  lucroPercent,
  lucroStatus,
}: FinanceiroIndicadoresProps) {
  const indicadores = [
    {
      label: 'CMV',
      labelFull: 'Custo de Mercadoria Vendida',
      value: formatCurrency(cmv),
      percent: `${cmvPercent}%`,
      status: cmvStatus,
      description: cmvDescription || 'Ideal: 30-35% da receita',
      statusColor: cmvStatus === 'Excelente' || cmvStatus === 'Saudável' ? 'text-success' : cmvStatus === 'Atenção' ? 'text-warning' : 'text-destructive',
      percentColor: Number(cmvPercent) <= 35 ? 'text-success' : Number(cmvPercent) <= 45 ? 'text-warning' : 'text-destructive',
    },
    {
      label: 'Despesas Fixas',
      labelFull: 'Despesas Operacionais',
      value: formatCurrency(despOperacionais),
      percent: `${despOperPercent}%`,
      status: despStatus,
      description: 'Água, luz, aluguel, salários',
      statusColor: despStatus === 'Saudável' ? 'text-success' : despStatus === 'Atenção' ? 'text-warning' : 'text-destructive',
      percentColor: despStatus === 'Saudável' ? 'text-success' : despStatus === 'Atenção' ? 'text-warning' : 'text-destructive',
    },
    {
      label: 'Deduções',
      labelFull: 'Impostos e Taxas',
      value: formatCurrency(impostos),
      percent: `${impostosPercent}%`,
      status: impostosStatus,
      description: 'Impostos, taxas de apps, estornos',
      statusColor: impostosStatus === 'Normal' ? 'text-foreground' : 'text-destructive',
      percentColor: impostosStatus === 'Normal' ? 'text-muted-foreground' : 'text-destructive',
    },
    {
      label: 'Lucro Líquido',
      labelFull: 'Lucro Líquido Final',
      value: formatCurrency(lucroLiquido),
      percent: `${lucroPercent}%`,
      status: lucroStatus,
      description: 'Resultado após todas deduções',
      statusColor: lucroStatus === 'Saudável' ? 'text-success' : lucroStatus === 'Atenção' ? 'text-warning' : 'text-destructive',
      percentColor: lucroStatus === 'Saudável' ? 'text-success' : lucroStatus === 'Atenção' ? 'text-warning' : 'text-destructive',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {indicadores.map((ind) => (
        <Card key={ind.label} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate md:hidden">{ind.label}</p>
              <p className="text-sm text-muted-foreground truncate hidden md:block">{ind.labelFull}</p>
              <p className="text-xl font-bold text-foreground">{ind.value}</p>
              <p className={`text-sm ${ind.statusColor}`}>{ind.status}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{ind.description}</p>
            </div>
            <span className={`text-sm font-medium ${ind.percentColor} shrink-0 ml-2`}>{ind.percent}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
