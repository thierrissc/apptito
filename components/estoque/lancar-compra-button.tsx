'use client'

import React from "react"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Trash2, AlertCircle, Search, Tags } from 'lucide-react'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/formatters'
import type { Estoque, Fornecedor, CategoriaFinanceira } from '@/lib/types'

interface CompraItem {
  id: string
  estoque_id: string
  estoque_nome: string
  quantidade: number
  unidade: string
  custo_unitario: number
  custo_total: number
  validade: string
  categoria_id: string
}

interface LancarCompraButtonProps {
  estoqueItems: Estoque[]
}

export function LancarCompraButton({ estoqueItems }: LancarCompraButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('')
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0])
  const [itens, setItens] = useState<CompraItem[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      if (user) {
        const [fornecedoresRes, categoriasRes] = await Promise.all([
          supabase.from('fornecedores').select('*').eq('user_id', user.id).eq('ativo', true).order('nome'),
          supabase.from('categorias_financeiras').select('*').eq('user_id', user.id).eq('ativo', true).eq('grupo_dre', 'cmv')
        ])
        setFornecedores(fornecedoresRes.data || [])
        setCategorias(categoriasRes.data || [])
      }
    }
    loadData()
  }, [])

  const addItem = (estoque: Estoque) => {
    const newItem: CompraItem = {
      id: crypto.randomUUID(),
      estoque_id: estoque.id,
      estoque_nome: estoque.nome,
      quantidade: 1,
      unidade: estoque.unidade,
      custo_unitario: estoque.custo_unitario,
      custo_total: estoque.custo_unitario,
      validade: '',
      categoria_id: ''
    }
    setItens([...itens, newItem])
    setSearchOpen(false)
    setSearchQuery('')
  }

  const updateItem = (id: string, field: keyof CompraItem, value: string | number) => {
    setItens(itens.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantidade' || field === 'custo_unitario') {
          updated.custo_total = Number(updated.quantidade) * Number(updated.custo_unitario)
        }
        return updated
      }
      return item
    }))
  }

  const removeItem = (id: string) => {
    setItens(itens.filter(item => item.id !== id))
  }

  const total = itens.reduce((acc, item) => acc + item.custo_total, 0)

  const filteredEstoque = estoqueItems.filter(item => 
    item.nome.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !itens.some(i => i.estoque_id === item.id)
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (itens.length === 0) {
      setError('Adicione pelo menos um item.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Você precisa estar logado.')
      setLoading(false)
      return
    }

    const { data: compra, error: compraError } = await supabase.from('compras').insert({
      user_id: user.id,
      fornecedor_id: selectedFornecedor || null,
      data_compra: dataCompra,
      total: total
    }).select().single()

    if (compraError) {
      setError('Erro ao registrar compra.')
      setLoading(false)
      return
    }

    for (const item of itens) {
      await supabase.from('compra_itens').insert({
        compra_id: compra.id,
        estoque_id: item.estoque_id,
        categoria_id: item.categoria_id || null,
        quantidade: item.quantidade,
        unidade: item.unidade,
        custo_unitario: item.custo_unitario,
        custo_total: item.custo_total,
        validade: item.validade || null
      })

      const estoqueItem = estoqueItems.find(e => e.id === item.estoque_id)
      if (estoqueItem) {
        const novaQuantidade = estoqueItem.quantidade + item.quantidade
        await supabase.from('estoque').update({
          quantidade: novaQuantidade,
          custo_unitario: item.custo_unitario,
          ultima_compra: dataCompra,
          proxima_validade: item.validade || null
        }).eq('id', item.estoque_id)
      }

      await supabase.from('estoque_movimentacao').insert({
        user_id: user.id,
        estoque_id: item.estoque_id,
        tipo: 'entrada',
        quantidade: item.quantidade,
        custo_total: item.custo_total,
        observacao: `Compra registrada - ${fornecedores.find(f => f.id === selectedFornecedor)?.nome || 'Sem fornecedor'}`
      })
    }

    await supabase.from('transacoes').insert({
      user_id: user.id,
      tipo: 'saida',
      categoria: 'Compras',
      descricao: `Compra de estoque - ${fornecedores.find(f => f.id === selectedFornecedor)?.nome || 'Sem fornecedor'}`,
      valor: total,
      data: dataCompra,
      hora: new Date().toTimeString().slice(0, 5),
    })

    setLoading(false)
    setOpen(false)
    setItens([])
    setSelectedFornecedor('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary text-primary bg-transparent hover:bg-primary/10">
          <Package className="h-4 w-4" />
          Lançar Compra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançar Compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!userId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você precisa estar logado.{' '}
                <a href="/auth/login" className="underline font-medium">Clique aqui para entrar</a>
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="font-semibold">Produtos</Label>
            
            <div className="border rounded-lg overflow-hidden">
              {itens.length > 0 && (
                <div className="divide-y">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Item</div>
                    <div className="col-span-1">QTD</div>
                    <div className="col-span-1">UN</div>
                    <div className="col-span-2">Custo</div>
                    <div className="col-span-2">Validade</div>
                    <div className="col-span-2">Categoria</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {itens.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center">
                      <div className="col-span-3 font-medium truncate">{item.estoque_nome}</div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.quantidade}
                          onChange={(e) => updateItem(item.id, 'quantidade', Number(e.target.value))}
                          className="h-8 p-1 text-center"
                        />
                      </div>
                      <div className="col-span-1 text-sm text-muted-foreground">{item.unidade}</div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.custo_unitario}
                          onChange={(e) => updateItem(item.id, 'custo_unitario', Number(e.target.value))}
                          className="h-8 p-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="date"
                          value={item.validade}
                          onChange={(e) => updateItem(item.id, 'validade', e.target.value)}
                          className="h-8 p-1 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Select value={item.categoria_id} onValueChange={(v) => updateItem(item.id, 'categoria_id', v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Cat." />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-3 border-t">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full gap-2 bg-transparent border-dashed">
                      <Plus className="h-4 w-4" />
                      Adicionar Produto
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar produto..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {filteredEstoque.slice(0, 10).map((item) => (
                            <CommandItem
                              key={item.id}
                              onSelect={() => addItem(item)}
                              className="cursor-pointer"
                            >
                              <div className="flex justify-between w-full">
                                <span>{item.nome}</span>
                                <span className="text-muted-foreground text-sm">{item.unidade}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="data_compra">Data da Compra</Label>
              <Input
                id="data_compra"
                type="date"
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="font-semibold text-lg">Total da Compra</span>
            <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || itens.length === 0} className="bg-primary text-primary-foreground">
              {loading ? 'Salvando...' : 'Registrar Compra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
