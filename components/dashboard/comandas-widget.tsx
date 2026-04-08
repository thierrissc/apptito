'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import type { Comanda } from '@/lib/types'

interface ComandasWidgetProps {
  abertas: Comanda[]
  pagas: Comanda[]
}

export function ComandasWidget({ abertas, pagas }: ComandasWidgetProps) {
  const [tab, setTab] = useState<'abertas' | 'pagas'>('abertas')
  
  const comandas = tab === 'abertas' ? abertas : pagas

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant={tab === 'abertas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('abertas')}
          className={tab === 'abertas' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
        >
          Em Aberto
        </Button>
        <Button
          variant={tab === 'pagas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('pagas')}
          className={tab === 'pagas' ? 'bg-muted text-foreground' : 'bg-transparent'}
        >
          Pagos
        </Button>
      </div>

      {comandas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma comanda {tab === 'abertas' ? 'em aberto' : 'paga hoje'}
        </p>
      ) : (
        <div className="space-y-3">
          {comandas.map((comanda) => (
            <div key={comanda.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Comanda</p>
                <p className="text-lg font-bold text-foreground">{comanda.numero}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Responsável</p>
                <p className="font-medium text-foreground">
                  {comanda.funcionario?.nome || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {tab === 'abertas' ? `Aberta há ${formatRelativeTime(comanda.created_at)}` : 'Total'}
                </p>
                <p className="font-bold text-foreground">{formatCurrency(comanda.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link 
        href="/dashboard/comandas" 
        className="mt-4 block text-center text-sm text-muted-foreground underline hover:text-foreground"
      >
        Ver tudo
      </Link>
    </Card>
  )
}
