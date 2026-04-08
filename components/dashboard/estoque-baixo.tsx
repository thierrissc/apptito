'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Estoque } from '@/lib/types'

interface EstoqueBaixoProps {
  items: Estoque[]
}

export function EstoqueBaixo({ items }: EstoqueBaixoProps) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Estoque</h3>
        <Link href="/dashboard/estoque" className="text-sm text-muted-foreground underline hover:text-foreground">
          Ver tudo
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item com estoque baixo</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isBaixo = item.quantidade <= item.quantidade_minima
            return (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-foreground">{item.nome}</span>
                <div className="flex items-center gap-2">
                  {isBaixo && (
                    <Badge variant="outline" className="border-primary bg-primary/10 text-primary text-xs">
                      Estoque Baixo
                    </Badge>
                  )}
                  <span className={`font-medium ${isBaixo ? 'text-primary' : 'text-foreground'}`}>
                    {item.quantidade}{item.unidade}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
