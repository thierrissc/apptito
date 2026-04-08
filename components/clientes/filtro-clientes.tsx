'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
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

interface FiltroClientesProps {
  onFilterChange?: (filter: string) => void
}

export function FiltroClientes({ onFilterChange }: FiltroClientesProps) {
  const [filterType, setFilterType] = useState<string>('all')

  const handleFilterChange = (value: string) => {
    setFilterType(value)
    onFilterChange?.(value)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Filtros</h3>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Cliente</Label>
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vip">VIP (Total {'>'} R$500)</SelectItem>
                <SelectItem value="regular">Regular (Total {'<'} R$500)</SelectItem>
                <SelectItem value="novos">Novos (Primeira compra)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setFilterType('all')
              onFilterChange?.('all')
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
