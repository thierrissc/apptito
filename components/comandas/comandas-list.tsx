'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import { Eye, CheckCircle, XCircle, Printer } from 'lucide-react'
import type { Comanda, Produto } from '@/lib/types'
import { VerComandaDialog } from './ver-comanda-dialog'
import { FecharComandaDialog } from './fechar-comanda-dialog'
import { createClient } from '@/lib/supabase/client'
import { cancelarComanda } from '@/lib/actions/estoque-actions'

interface ComandasListProps {
  comandas: Comanda[]
  produtos: Produto[]
}

export function ComandasList({ comandas, produtos }: ComandasListProps) {
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [closingComanda, setClosingComanda] = useState<Comanda | null>(null)
  const router = useRouter()

  const abertas = comandas.filter(c => c.status === 'aberta')
  const fechadas = comandas.filter(c => c.status === 'fechada')

  async function handleCancelar(id: string) {
    if (!confirm('Tem certeza que deseja cancelar esta comanda?')) return
    
    await cancelarComanda(id)
    router.refresh()
  }

  const statusConfig = {
    aberta: { label: 'Aberta', className: 'bg-primary/10 text-primary' },
    fechada: { label: 'Fechada', className: 'bg-success/10 text-success' },
    cancelada: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Em Aberto ({abertas.length})</h3>
          
          {abertas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhuma comanda aberta</p>
          ) : (
            <div className="space-y-3">
              {abertas.map((comanda) => (
                <div key={comanda.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Comanda</p>
                      <p className="text-xl font-bold text-foreground">{comanda.numero}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {comanda.funcionario?.nome || 'Sem responsável'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {comanda.mesa ? `Mesa ${comanda.mesa}` : 'Balcão'} • Aberta há {formatRelativeTime(comanda.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground mr-4">{formatCurrency(comanda.total)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setSelectedComanda(comanda)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-success"
                      onClick={() => setClosingComanda(comanda)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleCancelar(comanda.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Fechadas ({fechadas.length})</h3>
          
          {fechadas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhuma comanda fechada</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {fechadas.slice(0, 10).map((comanda) => (
                <div key={comanda.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Comanda</p>
                      <p className="text-xl font-bold text-foreground">{comanda.numero}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {comanda.funcionario?.nome || 'Sem responsável'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {comanda.forma_pagamento || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[comanda.status].className}>
                      {statusConfig[comanda.status].label}
                    </Badge>
                    <p className="font-bold text-foreground">{formatCurrency(comanda.total)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setSelectedComanda(comanda)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {selectedComanda && (
        <VerComandaDialog
          comanda={selectedComanda}
          open={!!selectedComanda}
          onOpenChange={(open) => !open && setSelectedComanda(null)}
        />
      )}

      {closingComanda && (
        <FecharComandaDialog
          comanda={closingComanda}
          open={!!closingComanda}
          onOpenChange={(open) => !open && setClosingComanda(null)}
        />
      )}
    </>
  )
}
