'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { Fornecedor } from '@/lib/types'

export function FornecedoresButton() {
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadFornecedores()
    }
  }, [open])

  async function loadFornecedores() {
    const supabase = createClient()
    const { data } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    if (data) {
      setFornecedores(data)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const fornecedorData = {
      nome: formData.get('nome') as string,
      telefone: formData.get('telefone') as string || null,
      email: formData.get('email') as string || null,
      cnpj: formData.get('cnpj') as string || null,
      endereco: formData.get('endereco') as string || null,
      observacoes: formData.get('observacoes') as string || null,
    }

    if (editingId) {
      await supabase
        .from('fornecedores')
        .update(fornecedorData)
        .eq('id', editingId)
    } else {
      await supabase.from('fornecedores').insert({
        user_id: user.id,
        ...fornecedorData,
      })
    }

    setLoading(false)
    setShowAddForm(false)
    setEditingId(null)
    loadFornecedores()
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return
    
    const supabase = createClient()
    await supabase
      .from('fornecedores')
      .update({ ativo: false })
      .eq('id', id)
    
    loadFornecedores()
    router.refresh()
  }

  function handleEdit(fornecedor: Fornecedor) {
    setEditingId(fornecedor.id)
    setShowAddForm(true)
  }

  const editingFornecedor = editingId ? fornecedores.find(f => f.id === editingId) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Building2 className="h-4 w-4" />
          Fornecedores
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fornecedores</DialogTitle>
        </DialogHeader>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Fornecedor *</Label>
              <Input 
                id="nome" 
                name="nome" 
                required 
                placeholder="Ex: Distribuidora ABC"
                defaultValue={editingFornecedor?.nome || ''}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone" 
                  name="telefone" 
                  placeholder="(00) 00000-0000"
                  defaultValue={editingFornecedor?.telefone || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input 
                  id="cnpj" 
                  name="cnpj" 
                  placeholder="00.000.000/0000-00"
                  defaultValue={editingFornecedor?.cnpj || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                placeholder="contato@fornecedor.com"
                defaultValue={editingFornecedor?.email || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input 
                id="endereco" 
                name="endereco" 
                placeholder="Rua, número, bairro, cidade"
                defaultValue={editingFornecedor?.endereco || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea 
                id="observacoes" 
                name="observacoes" 
                placeholder="Informações adicionais..."
                defaultValue={editingFornecedor?.observacoes || ''}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setShowAddForm(false); setEditingId(null) }} 
                className="bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="w-full gap-2 bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>

            {fornecedores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum fornecedor cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {fornecedores.map((fornecedor) => (
                  <div 
                    key={fornecedor.id} 
                    className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{fornecedor.nome}</p>
                      {fornecedor.telefone && (
                        <p className="text-sm text-muted-foreground">{fornecedor.telefone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(fornecedor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(fornecedor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
