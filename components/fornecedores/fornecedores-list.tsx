'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Phone, Mail, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Fornecedor } from '@/lib/types'
import { EditarFornecedorDialog } from './editar-fornecedor-dialog'

interface FornecedoresListProps {
  fornecedores: Fornecedor[]
}

export function FornecedoresList({ fornecedores }: FornecedoresListProps) {
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleToggleAtivo(fornecedor: Fornecedor) {
    await supabase
      .from('fornecedores')
      .update({ ativo: !fornecedor.ativo })
      .eq('id', fornecedor.id)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id)
    router.refresh()
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fornecedores.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum fornecedor cadastrado</p>
            <p className="text-sm text-muted-foreground mt-1">Cadastre fornecedores para organizar suas compras</p>
          </Card>
        ) : (
          fornecedores.map((fornecedor) => (
            <Card key={fornecedor.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{fornecedor.nome}</h3>
                    {fornecedor.cnpj && (
                      <p className="text-xs text-muted-foreground">{fornecedor.cnpj}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={fornecedor.ativo ? "default" : "secondary"}>
                    {fornecedor.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingFornecedor(fornecedor)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAtivo(fornecedor)}>
                        {fornecedor.ativo ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(fornecedor.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {fornecedor.telefone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {fornecedor.telefone}
                  </div>
                )}
                {fornecedor.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {fornecedor.email}
                  </div>
                )}
                {fornecedor.endereco && (
                  <p className="text-muted-foreground line-clamp-2">{fornecedor.endereco}</p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {editingFornecedor && (
        <EditarFornecedorDialog
          fornecedor={editingFornecedor}
          open={!!editingFornecedor}
          onOpenChange={(open) => !open && setEditingFornecedor(null)}
        />
      )}
    </>
  )
}
