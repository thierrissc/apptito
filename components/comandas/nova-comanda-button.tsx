'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Minus, Trash2, AlertCircle, Search } from 'lucide-react'
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
import { formatCurrency } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { verificarEstoqueProduto } from '@/lib/actions/estoque-actions'
import type { Produto, Cliente, Funcionario } from '@/lib/types'

interface CartItem {
  produto: Produto
  quantidade: number
  observacoes: string
}

interface NovaComandaButtonProps {
  produtos: Produto[]
  clientes: Cliente[]
  funcionarios: Funcionario[]
}

export function NovaComandaButton({ produtos, clientes, funcionarios }: NovaComandaButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [estoqueError, setEstoqueError] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.categoria?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const subtotal = cart.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0)

  async function addToCart() {
    const produto = produtos.find(p => p.id === selectedProduct)
    if (!produto) return

    setAddingProduct(true)
    setEstoqueError(null)

    const existingInCart = cart.find(item => item.produto.id === produto.id)
    const novaQuantidadeTotal = (existingInCart?.quantidade || 0) + 1

    const verificacao = await verificarEstoqueProduto(produto.id, novaQuantidadeTotal)
    
    if (!verificacao.disponivel) {
      setEstoqueError(verificacao.mensagem || 'Estoque insuficiente para este produto')
      setAddingProduct(false)
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id)
      if (existing) {
        return prev.map(item => 
          item.produto.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }
      return [...prev, { produto, quantidade: 1, observacoes: '' }]
    })
    setSelectedProduct('')
    setAddingProduct(false)
  }

  async function updateQuantity(produtoId: string, delta: number) {
    setEstoqueError(null)
    if (delta > 0) {
      const item = cart.find(i => i.produto.id === produtoId)
      if (item) {
        const verificacao = await verificarEstoqueProduto(produtoId, item.quantidade + delta)
        if (!verificacao.disponivel) {
          setEstoqueError(verificacao.mensagem || 'Estoque insuficiente')
          return
        }
      }
    }

    setCart(prev => prev.map(item => {
      if (item.produto.id === produtoId) {
        const newQty = item.quantidade + delta
        return newQty > 0 ? { ...item, quantidade: newQty } : item
      }
      return item
    }).filter(item => item.quantidade > 0))
  }

  function removeFromCart(produtoId: string) {
    setCart(prev => prev.filter(item => item.produto.id !== produtoId))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (cart.length === 0) return
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: subConta } = await supabase
      .from('sub_contas')
      .select('owner_id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .single()

    const effectiveUserId = subConta?.owner_id || user.id

    const mesaNumero = formData.get('mesa') as string
    
    let mesaId: string | null = null
    if (mesaNumero && mesaNumero.trim()) {
      const numeroMesa = parseInt(mesaNumero, 10)
      
      const { data: mesaExistente } = await supabase
        .from('mesas')
        .select('id')
        .eq('user_id', effectiveUserId)
        .eq('numero', numeroMesa)
        .single()

      if (!mesaExistente) {
        const { data: novaMesa } = await supabase
          .from('mesas')
          .insert({
            user_id: effectiveUserId,
            numero: numeroMesa,
            capacidade: 4,
            status: 'ocupada',
            ativo: true
          })
          .select()
          .single()
        
        if (novaMesa) {
          mesaId = novaMesa.id
        }
      } else {
        mesaId = mesaExistente.id
        await supabase
          .from('mesas')
          .update({ status: 'ocupada' })
          .eq('id', mesaId)
      }
    }

    const { data: ultimaComanda } = await supabase
      .from('comandas')
      .select('numero')
      .eq('user_id', effectiveUserId)
      .order('numero', { ascending: false })
      .limit(1)
      .single()

    const proximoNumero = (ultimaComanda?.numero || 0) + 1

    const { data: comanda, error: comandaError } = await supabase.from('comandas').insert({
      user_id: effectiveUserId,
      numero: proximoNumero,
      cliente_id: formData.get('cliente_id') as string || null,
      funcionario_id: formData.get('funcionario_id') as string || null,
      mesa: mesaNumero || null,
      status: 'aberta',
      subtotal,
      total: subtotal,
    }).select().single()

    if (comandaError || !comanda) {
      setLoading(false)
      return
    }

    const itens = cart.map(item => ({
      comanda_id: comanda.id,
      produto_id: item.produto.id,
      nome_produto: item.produto.nome,
      quantidade: item.quantidade,
      preco_unitario: item.produto.preco,
      subtotal: item.produto.preco * item.quantidade,
      observacoes: item.observacoes || null,
      status: 'pendente',
    }))

    await supabase.from('comanda_itens').insert(itens)

    setLoading(false)
    setCart([])
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground gap-2">
          <FileText className="h-4 w-4" />
          Nova Comanda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Comanda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mesa</Label>
              <Input name="mesa" placeholder="Ex: 01" />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select name="cliente_id">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select name="funcionario_id">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adicionar Produto</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-transparent"
                >
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Pesquisar produto...</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Digite o nome do produto..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                    <CommandGroup>
                      {filteredProdutos.slice(0, 15).map((produto) => (
                        <CommandItem
                          key={produto.id}
                          onSelect={async () => {
                            setAddingProduct(true)
                            setEstoqueError(null)
                            
                            const existingInCart = cart.find(item => item.produto.id === produto.id)
                            const novaQuantidadeTotal = (existingInCart?.quantidade || 0) + 1

                            const verificacao = await verificarEstoqueProduto(produto.id, novaQuantidadeTotal)
                            
                            if (!verificacao.disponivel) {
                              setEstoqueError(verificacao.mensagem || 'Estoque insuficiente para este produto')
                              setAddingProduct(false)
                              return
                            }

                            setCart(prev => {
                              const existing = prev.find(item => item.produto.id === produto.id)
                              if (existing) {
                                return prev.map(item => 
                                  item.produto.id === produto.id 
                                    ? { ...item, quantidade: item.quantidade + 1 }
                                    : item
                                )
                              }
                              return [...prev, { produto, quantidade: 1, observacoes: '' }]
                            })
                            
                            setSearchOpen(false)
                            setSearchQuery('')
                            setAddingProduct(false)
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex justify-between w-full">
                            <div>
                              <span className="font-medium">{produto.nome}</span>
                              {produto.categoria?.nome && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {produto.categoria.nome}
                                </span>
                              )}
                            </div>
                            <span className="text-primary font-medium">{formatCurrency(produto.preco)}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {estoqueError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{estoqueError}</AlertDescription>
            </Alert>
          )}

          <div className="border border-border rounded-lg p-4 min-h-[150px]">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Adicione itens à comanda</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.produto.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.produto.nome}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.produto.preco)} un.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateQuantity(item.produto.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantidade}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateQuantity(item.produto.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="w-20 text-right font-medium">
                        {formatCurrency(item.produto.preco * item.quantidade)}
                      </span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromCart(item.produto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center py-4 border-t border-border">
            <span className="text-lg font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || cart.length === 0} 
              className="bg-primary text-primary-foreground"
            >
              {loading ? 'Criando...' : 'Abrir Comanda'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
