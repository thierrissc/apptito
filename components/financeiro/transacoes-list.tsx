'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, formatTime } from '@/lib/formatters'
import { ArrowDown, ArrowUp, Wallet, MoreHorizontal, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Transacao } from '@/lib/types'

interface TransacoesListProps {
  transacoes: Transacao[]
  onUpdate?: () => void
}

export function TransacoesList({ transacoes, onUpdate }: TransacoesListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    setDeleting(null)
    
    if (!error && onUpdate) {
      onUpdate()
    }
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Transações</h3>

      {transacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma transação registrada</p>
      ) : (
        <div className="space-y-3">
          {transacoes.map((transacao) => (
            <div key={transacao.id} className="flex items-center gap-4 py-2 border-b border-border last:border-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{transacao.descricao}</p>
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(transacao.data)}
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {formatTime(transacao.data + 'T' + transacao.hora)}
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
              </div>
              <div className={`font-bold whitespace-nowrap ${transacao.tipo === 'entrada' ? 'text-foreground' : 'text-foreground'}`}>
                {formatCurrency(transacao.valor)}
              </div>
              {transacao.tipo === 'entrada' ? (
                <ArrowUp className="h-5 w-5 text-success shrink-0" />
              ) : (
                <ArrowDown className="h-5 w-5 text-destructive shrink-0" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleDelete(transacao.id)}
                    className="text-destructive"
                    disabled={deleting === transacao.id}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting === transacao.id ? 'Excluindo...' : 'Excluir'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
