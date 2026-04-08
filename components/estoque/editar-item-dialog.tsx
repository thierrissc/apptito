'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Estoque } from '@/lib/types'

const unidades = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct']

interface EditarItemDialogProps {
  item: Estoque
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditarItemDialog({ item, open, onOpenChange }: EditarItemDialogProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from('estoque').update({
      nome: formData.get('nome') as string,
      quantidade: Number(formData.get('quantidade')),
      unidade: formData.get('unidade') as string,
      quantidade_minima: Number(formData.get('quantidade_minima')),
      custo_unitario: Number(formData.get('custo_unitario')),
      fornecedor: formData.get('fornecedor') as string || null,
      proxima_validade: formData.get('proxima_validade') as string || null,
      updated_at: new Date().toISOString(),
    }).eq('id', item.id)

    setLoading(false)

    if (!error) {
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item do Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto</Label>
            <Input id="nome" name="nome" required defaultValue={item.nome} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input 
                id="quantidade" 
                name="quantidade" 
                type="number" 
                step="0.001" 
                min="0" 
                required 
                defaultValue={item.quantidade}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select name="unidade" defaultValue={item.unidade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade_minima">Qtd. Mínima (alerta)</Label>
              <Input 
                id="quantidade_minima" 
                name="quantidade_minima" 
                type="number" 
                step="0.001" 
                min="0" 
                defaultValue={item.quantidade_minima}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custo_unitario">Custo Unitário (R$)</Label>
              <Input 
                id="custo_unitario" 
                name="custo_unitario" 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                defaultValue={item.custo_unitario}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input 
              id="fornecedor" 
              name="fornecedor" 
              defaultValue={item.fornecedor || ''} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proxima_validade">Próxima Validade</Label>
            <Input 
              id="proxima_validade" 
              name="proxima_validade" 
              type="date" 
              defaultValue={item.proxima_validade || ''}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
