'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, getFrequencyLabel } from '@/lib/formatters'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Cliente } from '@/lib/types'
import { EditarClienteDialog } from './editar-cliente-dialog'

interface ClientesListProps {
  clientes: Cliente[]
}

export function ClientesList({ clientes }: ClientesListProps) {
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    
    const supabase = createClient()
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    
    if (!error) {
      router.refresh()
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Data Nascimento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Frequência</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Última Compra</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ticket Médio</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum cliente cadastrado
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => {
                  const ticketMedio = cliente.quantidade_compras > 0 
                    ? cliente.total_compras / cliente.quantidade_compras 
                    : 0
                  
                  return (
                    <tr key={cliente.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-4 text-foreground">{cliente.nome}</td>
                      <td className="px-6 py-4 text-foreground">
                        {cliente.data_nascimento ? formatDate(cliente.data_nascimento) : '-'}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {getFrequencyLabel(cliente.ultima_compra, cliente.quantidade_compras)}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {cliente.ultima_compra ? formatDate(cliente.ultima_compra) : '-'}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {formatCurrency(ticketMedio)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingCliente(cliente)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(cliente.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editingCliente && (
        <EditarClienteDialog 
          cliente={editingCliente} 
          open={!!editingCliente} 
          onOpenChange={(open) => !open && setEditingCliente(null)} 
        />
      )}
    </>
  )
}
