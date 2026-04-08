'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import type { Produto } from '@/lib/types'
import { UtensilsCrossed } from 'lucide-react'

interface MaisVendidosProps {
  produtos: Produto[]
}

export function MaisVendidos({ produtos }: MaisVendidosProps) {
  const produtosComVendas = produtos.slice(0, 3).map((p, i) => ({
    ...p,
    vendas: Math.max(100 - i * 24, 10),
  }))

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Mais Vendidos</h3>
        <Link href="/dashboard/produtos" className="text-sm text-muted-foreground underline hover:text-foreground">
          Ver tudo
        </Link>
      </div>

      {produtosComVendas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
      ) : (
        <div className="space-y-3">
          {produtosComVendas.map((produto) => (
            <div key={produto.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                {produto.imagem_url ? (
                  <Image
                    src={produto.imagem_url || "/placeholder.svg"}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-success text-success-foreground text-xs">
                    {produto.vendas} vendas
                  </Badge>
                  <span className="font-medium text-foreground">{formatCurrency(produto.preco)}</span>
                </div>
                <p className="truncate text-sm text-foreground">{produto.nome}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
