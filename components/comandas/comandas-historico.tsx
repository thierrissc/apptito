'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { Eye, ChevronDown, ChevronUp } from 'lucide-react'
import type { Comanda } from '@/lib/types'
import { VerComandaDialog } from './ver-comanda-dialog'

interface ComandasHistoricoProps {
  comandas: Comanda[]
}

export function ComandasHistorico({ comandas }: ComandasHistoricoProps) {
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [expanded, setExpanded] = useState(true)

  const fechadas = comandas.filter(c => c.status === 'fechada' || c.status === 'cancelada')
  const recentes = fechadas.slice(0, 10)

  const statusConfig = {
    aberta: { label: 'Aberta', className: 'bg-primary/10 text-primary' },
    fechada: { label: 'Fechada', className: 'bg-success/10 text-success' },
    cancelada: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
  }

  return (
    <>
      <Card className="p-6">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="text-lg font-semibold text-foreground">
            Histórico ({fechadas.length})
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {expanded && (
          <div className="mt-4 space-y-3">
            {recentes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma comanda finalizada</p>
            ) : (
              recentes.map((comanda) => (
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
                        {comanda.mesa ? `Mesa ${comanda.mesa}` : 'Balcão'} • {formatDateTime(comanda.fechada_em || comanda.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusConfig[comanda.status].className}>
                      {statusConfig[comanda.status].label}
                    </Badge>
                    <p className="font-bold text-foreground">{formatCurrency(comanda.total)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedComanda(comanda)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {selectedComanda && (
        <VerComandaDialog
          comanda={selectedComanda}
          open={!!selectedComanda}
          onOpenChange={(open) => !open && setSelectedComanda(null)}
        />
      )}
    </>
  )
}
