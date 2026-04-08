'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const tiposTransacao = [
  { value: 'todos', label: 'Todos' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'saida', label: 'Saídas' },
]

const formasPagamento = [
  { value: 'todos', label: 'Todas' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'boleto', label: 'Boleto' },
]

export function FiltroFinanceiro() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  
  const currentTipo = searchParams.get('tipo') || 'todos'
  const currentFormaPagamento = searchParams.get('forma_pagamento') || 'todos'
  
  const hasFilters = currentTipo !== 'todos' || currentFormaPagamento !== 'todos'
  const activeFiltersCount = [currentTipo !== 'todos', currentFormaPagamento !== 'todos'].filter(Boolean).length

  function applyFilters(tipo: string, formaPagamento: string) {
    const params = new URLSearchParams(searchParams.toString())
    
    if (tipo !== 'todos') {
      params.set('tipo', tipo)
    } else {
      params.delete('tipo')
    }
    
    if (formaPagamento !== 'todos') {
      params.set('forma_pagamento', formaPagamento)
    } else {
      params.delete('forma_pagamento')
    }
    
    router.push(`/dashboard/financeiro?${params.toString()}`)
    setOpen(false)
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tipo')
    params.delete('forma_pagamento')
    router.push(`/dashboard/financeiro?${params.toString()}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 relative">
          <SlidersHorizontal className="h-5 w-5" />
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          <span className="sr-only">Filtros</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Filtros</h4>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-muted-foreground bg-transparent">
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Transação</Label>
            <Select 
              value={currentTipo} 
              onValueChange={(value) => applyFilters(value, currentFormaPagamento)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposTransacao.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select 
              value={currentFormaPagamento} 
              onValueChange={(value) => applyFilters(currentTipo, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.value} value={forma.value}>
                    {forma.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
