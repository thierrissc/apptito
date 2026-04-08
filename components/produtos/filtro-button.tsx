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

interface FiltroButtonProps {
  categorias?: { id: string; nome: string }[]
  onFilterChange?: (filters: { categoria: string; status: string }) => void
}

export function FiltroButton({ categorias = [], onFilterChange }: FiltroButtonProps) {
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const handleCategoriaChange = (value: string) => {
    setFilterCategoria(value)
    onFilterChange?.({ categoria: value, status: filterStatus })
  }

  const handleStatusChange = (value: string) => {
    setFilterStatus(value)
    onFilterChange?.({ categoria: filterCategoria, status: value })
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
            <Label>Categoria</Label>
            <Select value={filterCategoria} onValueChange={handleCategoriaChange}>
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="bg-transparent">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setFilterCategoria('all')
              setFilterStatus('all')
              onFilterChange?.({ categoria: 'all', status: 'all' })
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
