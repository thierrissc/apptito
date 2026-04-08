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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { excluirEstoque } from '@/lib/actions/estoque-actions'
import type { Estoque } from '@/lib/types'
import { EditarItemDialog } from './editar-item-dialog'
import { DetalhesEstoqueDialog } from './detalhes-estoque-dialog'

interface EstoqueListProps {
  items: Estoque[]
}

export function EstoqueList({ items }: EstoqueListProps) {
  const [editingItem, setEditingItem] = useState<Estoque | null>(null)
  const [deletingItem, setDeletingItem] = useState<Estoque | null>(null)
  const [detailItem, setDetailItem] = useState<Estoque | null>(null)
  const [deleteMotivo, setDeleteMotivo] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!deletingItem) return
    
    setDeleteLoading(true)
    const result = await excluirEstoque(deletingItem.id, deleteMotivo || 'Exclusão manual')
    setDeleteLoading(false)
    
    if (result.success) {
      setDeletingItem(null)
      setDeleteMotivo('')
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Item</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Última Compra</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Próxima Validade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Quantidade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Custo</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum item cadastrado no estoque
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isBaixo = item.quantidade <= item.quantidade_minima
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setDetailItem(item)}>
                      <td className="px-6 py-4 text-foreground">{item.nome}</td>
                      <td className="px-6 py-4 text-foreground">
                        {item.ultima_compra ? formatDate(item.ultima_compra) : '-'}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {item.proxima_validade ? formatDate(item.proxima_validade) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isBaixo ? 'text-primary' : 'text-foreground'}`}>
                            {item.quantidade}{item.unidade}
                          </span>
                          {isBaixo && (
                            <Badge variant="outline" className="border-primary bg-primary/10 text-primary text-xs">
                              Estoque Baixo
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {formatCurrency(item.custo_unitario)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingItem(item)}
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

      {editingItem && (
        <EditarItemDialog 
          item={editingItem} 
          open={!!editingItem} 
          onOpenChange={(open) => !open && setEditingItem(null)} 
        />
      )}

      <DetalhesEstoqueDialog
        item={detailItem}
        open={!!detailItem}
        onOpenChange={(open) => !open && setDetailItem(null)}
      />

      <Dialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Item do Estoque
            </DialogTitle>
            <DialogDescription>
              Ao excluir este item, uma transação de perda será registrada no financeiro
              com o valor total do estoque ({deletingItem && formatCurrency(deletingItem.quantidade * deletingItem.custo_unitario)}).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{deletingItem?.nome}</p>
              <p className="text-sm text-muted-foreground">
                {deletingItem?.quantidade}{deletingItem?.unidade} x {deletingItem && formatCurrency(deletingItem.custo_unitario)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da exclusão (opcional)</Label>
              <Input
                id="motivo"
                value={deleteMotivo}
                onChange={(e) => setDeleteMotivo(e.target.value)}
                placeholder="Ex: Vencido, Avariado, Contagem incorreta..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingItem(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Excluindo...' : 'Excluir e Registrar Perda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
