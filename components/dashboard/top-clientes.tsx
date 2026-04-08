'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/formatters'
import type { Cliente } from '@/lib/types'

interface TopClientesProps {
  clientes: Cliente[]
}

export function TopClientes({ clientes }: TopClientesProps) {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Top Clientes</h3>

      {clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cliente com compras</p>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => {
            const initials = cliente.nome
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <div key={cliente.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success text-success-foreground text-xs">
                      {cliente.quantidade_compras} Compras
                    </Badge>
                    <span className="font-medium text-foreground">
                      {formatCurrency(cliente.total_compras)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{cliente.nome}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link 
        href="/dashboard/clientes" 
        className="mt-4 block text-center text-sm text-muted-foreground underline hover:text-foreground"
      >
        Ver tudo
      </Link>
    </Card>
  )
}
