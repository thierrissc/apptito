'use client'

import { Card } from '@/components/ui/card'
import { formatCurrency, formatTime } from '@/lib/formatters'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Transacao } from '@/lib/types'

interface VendasResumoProps {
  comandasAbertas: number
  comandasFechadas: number
  transacoes: Transacao[]
}

export function VendasResumo({ comandasAbertas, comandasFechadas, transacoes }: VendasResumoProps) {
  const ultimasTransacoes = transacoes.slice(0, 5)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Resumo do Dia</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-3xl font-bold text-primary">{comandasAbertas}</p>
          <p className="text-sm text-muted-foreground">Comandas Abertas</p>
        </div>
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-3xl font-bold text-success">{comandasFechadas}</p>
          <p className="text-sm text-muted-foreground">Comandas Fechadas</p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Últimas Movimentações</h4>
        
        {ultimasTransacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação hoje</p>
        ) : (
          <div className="space-y-2">
            {ultimasTransacoes.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {t.tipo === 'entrada' ? (
                    <ArrowUp className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm text-foreground truncate max-w-[150px]">{t.descricao}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatTime(t.data + 'T' + t.hora)}</span>
                  <span className={`text-sm font-medium ${t.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(t.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
