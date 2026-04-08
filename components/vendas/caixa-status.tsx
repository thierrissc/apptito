'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import type { Caixa } from '@/lib/types'

interface CaixaStatusProps {
  caixa: Caixa | null
  totalEntradas: number
  totalSaidas: number
  saldoDinheiro: number
}

export function CaixaStatus({ caixa, totalEntradas, totalSaidas, saldoDinheiro }: CaixaStatusProps) {
  const saldoAtual = caixa 
    ? Number(caixa.valor_inicial) + totalEntradas - totalSaidas 
    : 0
  
  const totalSangrias = caixa ? Number(caixa.total_sangrias || 0) : 0
  const totalSuprimentos = caixa ? Number(caixa.total_suprimentos || 0) : 0

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Status do Caixa</h3>
        <Badge 
          className={caixa 
            ? 'bg-success text-success-foreground' 
            : 'bg-destructive text-destructive-foreground'
          }
        >
          {caixa ? 'Aberto' : 'Fechado'}
        </Badge>
      </div>

      {caixa ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Abertura</p>
              <p className="font-medium text-foreground">{formatDateTime(caixa.data_abertura)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responsável</p>
              <p className="font-medium text-foreground">{caixa.funcionario?.nome || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Inicial</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(caixa.valor_inicial)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(saldoAtual)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="font-medium text-success">{formatCurrency(totalEntradas)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saídas</p>
                <p className="font-medium text-destructive">{formatCurrency(totalSaidas)}</p>
              </div>
            </div>
          </div>

          {(totalSangrias > 0 || totalSuprimentos > 0) && (
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Movimentações de Dinheiro</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sangrias</p>
                  <p className="font-medium text-amber-600">{formatCurrency(totalSangrias)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suprimentos</p>
                  <p className="font-medium text-emerald-600">{formatCurrency(totalSuprimentos)}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Saldo em Dinheiro</p>
                  <p className="font-bold text-foreground">{formatCurrency(saldoDinheiro)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">O caixa está fechado.</p>
          <p className="text-sm text-muted-foreground mt-1">Abra o caixa para iniciar as vendas.</p>
        </div>
      )}
    </Card>
  )
}
