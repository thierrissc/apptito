'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

interface DRESimplificadoProps {
  receitaBruta: number
  deducoes: number
  cmv: number
  despFixas: number
  despFinanceiras: number
  lucroLiquido: number
}

export function DRESimplificado({
  receitaBruta,
  deducoes,
  cmv,
  despFixas,
  despFinanceiras,
  lucroLiquido,
}: DRESimplificadoProps) {
  const receitaLiquida = receitaBruta - deducoes
  const lucroBruto = receitaLiquida - cmv
  const resultadoOperacional = lucroBruto - despFixas

  const items = [
    { 
      labelFull: 'Receita Bruta', 
      labelShort: 'Receita Bruta',
      value: receitaBruta, 
      type: 'normal',
      description: 'Total de vendas e serviços'
    },
    { 
      labelFull: '(-) Deduções', 
      labelShort: '(-) Deduções',
      value: deducoes, 
      type: 'negative',
      description: 'Impostos, taxas e estornos'
    },
    { 
      labelFull: '(=) Receita Líquida', 
      labelShort: '(=) Rec. Líq.',
      value: receitaLiquida, 
      type: 'result',
      description: 'Receita Bruta - Deduções'
    },
    { 
      labelFull: '(-) Custo de Mercadoria Vendida', 
      labelShort: '(-) CMV',
      value: cmv, 
      type: 'negative',
      description: 'Compras e insumos'
    },
    { 
      labelFull: '(=) Lucro Bruto', 
      labelShort: '(=) Lucro Bruto',
      value: lucroBruto, 
      type: 'result-green',
      description: 'Receita Líquida - CMV'
    },
    { 
      labelFull: '(-) Despesas Fixas', 
      labelShort: '(-) Desp. Fixas',
      value: despFixas, 
      type: 'negative',
      description: 'Água, luz, aluguel, salários'
    },
    { 
      labelFull: '(=) Resultado Operacional', 
      labelShort: '(=) Res. Oper.',
      value: resultadoOperacional, 
      type: 'result',
      description: 'Lucro Bruto - Despesas Fixas'
    },
    { 
      labelFull: '(-) Despesas Financeiras', 
      labelShort: '(-) Desp. Fin.',
      value: despFinanceiras, 
      type: 'negative',
      description: 'Juros e taxas bancárias'
    },
    { 
      labelFull: '(=) Lucro Líquido', 
      labelShort: '(=) Lucro Líq.',
      value: lucroLiquido, 
      type: 'result-final',
      description: 'Resultado final do período'
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="mb-6 text-lg font-semibold text-foreground">DRE Simplificado</h3>

      <div className="space-y-3">
        {items.map((item, index) => {
          let labelClass = 'text-foreground'
          let valueClass = 'text-foreground'

          if (item.type === 'negative') {
            labelClass = 'text-destructive'
          } else if (item.type === 'result') {
            labelClass = 'text-foreground font-medium'
          } else if (item.type === 'result-green') {
            labelClass = 'text-success font-medium'
            valueClass = 'text-foreground'
          } else if (item.type === 'result-final') {
            labelClass = 'text-success font-bold'
            valueClass = 'text-success font-bold'
          }

          return (
            <div key={index} className="flex items-center justify-between group">
              <div className="flex flex-col">
                <span className={`${labelClass} hidden sm:block`}>{item.labelFull}</span>
                <span className={`${labelClass} sm:hidden`}>{item.labelShort}</span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </span>
              </div>
              <span className={`${valueClass} whitespace-nowrap`}>{formatCurrency(item.value)}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>CMV Ideal:</strong> 30-35% da receita
        </p>
      </div>
    </Card>
  )
}
