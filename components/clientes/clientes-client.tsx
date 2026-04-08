'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ClientesList } from '@/components/clientes/clientes-list'
import { CadastrarClienteButton } from '@/components/clientes/cadastrar-cliente-button'
import { FiltroClientes } from '@/components/clientes/filtro-clientes'
import type { Cliente } from '@/lib/types'

interface ClientesClientProps {
  clientesIniciais: Cliente[]
  userId: string
}

export function ClientesClient({ clientesIniciais, userId }: ClientesClientProps) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const supabase = createClient()

  const fetchClientes = useCallback(async () => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', userId)
      .order('nome', { ascending: true })
    if (data) setClientes(data)
  }, [supabase, userId])

  const filteredClientes = clientes.filter(c => {
    const matchesSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone?.includes(search)

    if (!matchesSearch) return false

    switch (filterType) {
      case 'vip':
        return c.total_compras > 500
      case 'regular':
        return c.total_compras <= 500
      case 'novos':
        return c.ultima_compra === null || c.total_compras === 0
      default:
        return true
    }
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-3">
          <FiltroClientes onFilterChange={setFilterType} />
          <CadastrarClienteButton onSuccess={fetchClientes} />
        </div>
      </div>

      <ClientesList clientes={filteredClientes} />
    </>
  )
}
