'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tags, Plus, Trash2, Pencil } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaFinanceira } from '@/lib/types'

const gruposDre = [
  { value: 'receita_bruta', label: 'Receita Bruta', tipo: 'entrada', description: 'Vendas, serviços e outras entradas' },
  { value: 'deducoes', label: 'Deduções', tipo: 'saida', description: 'Impostos, taxas de apps, estornos' },
  { value: 'cmv', label: 'CMV', tipo: 'saida', description: 'Compras e insumos' },
  { value: 'despesas_fixas', label: 'Despesas Fixas', tipo: 'saida', description: 'Água, luz, aluguel, salários' },
  { value: 'despesas_financeiras', label: 'Despesas Financeiras', tipo: 'saida', description: 'Juros, taxas bancárias' },
]

export function CategoriasFinanceirasButton() {
  const [open, setOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      loadCategorias()
    }
  }, [open])

  async function loadCategorias() {
    const supabase = createClient()
    const { data } = await supabase
      .from('categorias_financeiras')
      .select('*')
      .eq('ativo', true)
      .order('grupo_dre', { ascending: true })
      .order('nome', { ascending: true })
    
    if (data) {
      setCategorias(data)
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

    const grupoDre = formData.get('grupo_dre') as string
    const grupo = gruposDre.find(g => g.value === grupoDre)
    const tipo = grupo?.tipo || 'saida'

    if (editingId) {
      await supabase
        .from('categorias_financeiras')
        .update({
          nome: formData.get('nome') as string,
          grupo_dre: grupoDre,
          tipo: tipo as 'entrada' | 'saida',
        })
        .eq('id', editingId)
    } else {
      await supabase.from('categorias_financeiras').insert({
        user_id: user.id,
        nome: formData.get('nome') as string,
        tipo: tipo as 'entrada' | 'saida',
        grupo_dre: grupoDre,
      })
    }

    setLoading(false)
    setShowAddForm(false)
    setEditingId(null)
    loadCategorias()
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    
    const supabase = createClient()
    await supabase
      .from('categorias_financeiras')
      .update({ ativo: false })
      .eq('id', id)
    
    loadCategorias()
    router.refresh()
  }

  function handleEdit(categoria: CategoriaFinanceira) {
    setEditingId(categoria.id)
    setShowAddForm(true)
  }

  function getGrupoLabel(grupoDre: string) {
    const grupo = gruposDre.find(g => g.value === grupoDre)
    return grupo?.label || grupoDre
  }

  function getGrupoColor(grupoDre: string) {
    switch (grupoDre) {
      case 'receita_bruta': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'deducoes': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'cmv': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'despesas_fixas': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'despesas_financeiras': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const categoriasPorGrupo = gruposDre.map(grupo => ({
    ...grupo,
    categorias: categorias.filter(c => c.grupo_dre === grupo.value)
  }))

  const editingCategoria = editingId ? categorias.find(c => c.id === editingId) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Tags className="h-4 w-4" />
          Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Categorias Financeiras</DialogTitle>
        </DialogHeader>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Categoria</Label>
              <Input 
                id="nome" 
                name="nome" 
                required 
                placeholder="Ex: Vendas Balcão"
                defaultValue={editingCategoria?.nome || ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Grupo do DRE</Label>
              <Select name="grupo_dre" required defaultValue={editingCategoria?.grupo_dre || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {gruposDre.map((grupo) => (
                    <SelectItem key={grupo.value} value={grupo.value}>
                      <div className="flex flex-col">
                        <span>{grupo.label}</span>
                        <span className="text-xs text-muted-foreground">{grupo.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Nova Categoria
            </Button>

            <div className="space-y-4">
              {categoriasPorGrupo.map((grupo) => (
                <div key={grupo.value} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className={getGrupoColor(grupo.value)}>
                      {grupo.label}
                    </Badge>
                    <span className="text-xs">({grupo.tipo === 'entrada' ? 'Entrada' : 'Saída'})</span>
                  </h4>
                  {grupo.categorias.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-2">Nenhuma categoria</p>
                  ) : (
                    <div className="space-y-1">
                      {grupo.categorias.map((categoria) => (
                        <div 
                          key={categoria.id} 
                          className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                        >
                          <span className="text-sm text-foreground">{categoria.nome}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(categoria)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(categoria.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
