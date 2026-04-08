'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters'
import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'
import type { Transacao } from '@/lib/types'

interface UltimasTransacoesProps {
  transacoes: Transacao[]
}

export function UltimasTransacoes({ transacoes }: UltimasTransacoesProps) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Últimas transações</h3>
        <Link href="/dashboard/financeiro" className="text-sm text-muted-foreground underline hover:text-foreground">
          Ver tudo
        </Link>
      </div>

      {transacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma transação registrada</p>
      ) : (
        <div className="space-y-3">
          {transacoes.map((transacao) => (
            <div key={transacao.id} className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{transacao.descricao}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(transacao.data)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(transacao.data + 'T' + transacao.hora)}
              </div>
              <div className="text-sm text-muted-foreground">
                {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
              </div>
              <div className={`font-bold ${transacao.tipo === 'entrada' ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(transacao.valor)}
              </div>
              {transacao.tipo === 'entrada' ? (
                <ArrowUp className="h-5 w-5 text-success" />
              ) : (
                <ArrowDown className="h-5 w-5 text-destructive" />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
