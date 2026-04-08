'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ArrowLeft, CheckCircle, Printer } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Produto, Cliente, Funcionario } from '@/lib/types'
import { printVenda } from '@/lib/print-utils'

interface CartItem {
  produto: Produto
  quantidade: number
}

interface NovaVendaButtonProps {
  produtos: Produto[]
  clientes: Cliente[]
  funcionarios: Funcionario[]
}

type Step = 'cart' | 'checkout' | 'success'

const formasPagamento = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'credito', label: 'Cartao Credito', icon: CreditCard },
  { value: 'debito', label: 'Cartao Debito', icon: CreditCard },
]

export function NovaVendaButton({ produtos, clientes, funcionarios }: NovaVendaButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('cart')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [clienteId, setClienteId] = useState<string>('')
  const [funcionarioId, setFuncionarioId] = useState<string>('')
  const [formaPagamento, setFormaPagamento] = useState<string>('')
  const [desconto, setDesconto] = useState<string>('0')
  const [observacoes, setObservacoes] = useState<string>('')
  const [lastVenda, setLastVenda] = useState<{
    numero: number
    created_at: string
  } | null>(null)
  const router = useRouter()

  const subtotal = cart.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0)
  const descontoNum = Number(desconto) || 0
  const total = Math.max(0, subtotal - descontoNum)

  function addToCart() {
    const produto = produtos.find(p => p.id === selectedProduct)
    if (!produto) return

    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id)
      if (existing) {
        return prev.map(item => 
          item.produto.id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      }
      return [...prev, { produto, quantidade: 1 }]
    })
    setSelectedProduct('')
  }

  function updateQuantity(produtoId: string, delta: number) {
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

  function goToCheckout() {
    if (cart.length === 0) return
    setStep('checkout')
  }

  function goBackToCart() {
    setStep('cart')
  }

  function resetAll() {
    setCart([])
    setStep('cart')
    setSelectedProduct('')
    setClienteId('')
    setFuncionarioId('')
    setFormaPagamento('')
    setDesconto('0')
    setObservacoes('')
    setLastVenda(null)
  }

  async function handleFinalize() {
    if (!formaPagamento) return
    setLoading(true)

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: ultimaComanda } = await supabase
      .from('comandas')
      .select('numero')
      .eq('user_id', user.id)
      .order('numero', { ascending: false })
      .limit(1)
      .single()

    const proximoNumero = (ultimaComanda?.numero || 0) + 1

    const { data: comanda, error: comandaError } = await supabase.from('comandas').insert({
      user_id: user.id,
      numero: proximoNumero,
      cliente_id: clienteId || null,
      funcionario_id: funcionarioId || null,
      status: 'fechada',
      subtotal,
      desconto: descontoNum,
      total,
      forma_pagamento: formaPagamento,
      observacoes: observacoes || null,
      fechada_em: new Date().toISOString(),
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
      status: 'entregue',
    }))

    await supabase.from('comanda_itens').insert(itens)

    const agora = new Date()

    await supabase.from('transacoes').insert({
      user_id: user.id,
      tipo: 'entrada',
      categoria: 'Venda PDV',
      descricao: `Venda #${proximoNumero}`,
      valor: total,
      data: agora.toISOString().split('T')[0],
      hora: agora.toTimeString().split(' ')[0],
      forma_pagamento: formaPagamento,
      comanda_id: comanda.id,
    })

    const { data: caixaAberto } = await supabase
      .from('caixa')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'aberto')
      .maybeSingle()

    if (caixaAberto) {
      await supabase
        .from('caixa')
        .update({ total_entradas: (Number(caixaAberto.total_entradas) || 0) + total })
        .eq('id', caixaAberto.id)
    }

    if (clienteId) {
      const cliente = await supabase
        .from('clientes')
        .select('total_compras, quantidade_compras')
        .eq('id', clienteId)
        .single()
      
      if (cliente.data) {
        await supabase.from('clientes').update({
          total_compras: Number(cliente.data.total_compras) + total,
          quantidade_compras: Number(cliente.data.quantidade_compras) + 1,
          ultima_compra: new Date().toISOString(),
        }).eq('id', clienteId)
      }
    }

    setLoading(false)
    setLastVenda({
      numero: proximoNumero,
      created_at: comanda.created_at
    })
    setStep('success')
    router.refresh()
  }

  function handlePrint() {
    if (!lastVenda) return
    
    const cliente = clientes.find(c => c.id === clienteId)
    const funcionario = funcionarios.find(f => f.id === funcionarioId)
    
    printVenda({
      numero: lastVenda.numero,
      cliente: cliente ? { nome: cliente.nome, telefone: cliente.telefone || undefined } : null,
      funcionario: funcionario ? { nome: funcionario.nome } : null,
      itens: cart.map(item => ({
        nome_produto: item.produto.nome,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
        subtotal: item.produto.preco * item.quantidade,
        observacoes: null
      })),
      subtotal,
      desconto: descontoNum,
      total,
      forma_pagamento: formaPagamento,
      created_at: lastVenda.created_at,
      observacoes: observacoes || null
    })
  }

  function handleFinishWithoutPrint() {
    resetAll()
    setOpen(false)
  }

  function handleFinishWithPrint() {
    handlePrint()
    resetAll()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) resetAll()
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground gap-2">
          <ShoppingCart className="h-4 w-4" />
          Nova Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'cart' && 'Nova Venda - Selecionar Produtos'}
            {step === 'checkout' && 'Finalizar Venda - Pagamento'}
            {step === 'success' && 'Venda Finalizada'}
          </DialogTitle>
        </DialogHeader>

        {step === 'cart' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
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
                <Label>Vendedor (opcional)</Label>
                <Select value={funcionarioId} onValueChange={setFuncionarioId}>
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

            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} - {formatCurrency(p.preco)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={addToCart} disabled={!selectedProduct}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="border border-border rounded-lg p-4 min-h-[150px]">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Carrinho vazio</p>
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
              <span className="text-lg font-semibold text-foreground">Subtotal</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={goToCheckout}
                disabled={cart.length === 0} 
                className="bg-primary text-primary-foreground"
              >
                Ir para Pagamento
              </Button>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Resumo do Pedido</h4>
              <div className="space-y-1">
                {cart.map((item) => (
                  <div key={item.produto.id} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.quantidade}x {item.produto.nome}</span>
                    <span className="font-medium text-foreground">{formatCurrency(item.produto.preco * item.quantidade)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                min="0"
                max={subtotal}
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              {descontoNum > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="text-destructive">-{formatCurrency(descontoNum)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <div className="grid grid-cols-2 gap-2">
                {formasPagamento.map((fp) => {
                  const Icon = fp.icon
                  return (
                    <Button
                      key={fp.value}
                      type="button"
                      variant={formaPagamento === fp.value ? 'default' : 'outline'}
                      className={formaPagamento === fp.value 
                        ? 'bg-primary text-primary-foreground gap-2' 
                        : 'bg-transparent gap-2'}
                      onClick={() => setFormaPagamento(fp.value)}
                    >
                      <Icon className="h-4 w-4" />
                      {fp.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observacoes</Label>
              <Textarea
                id="obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observacoes da venda..."
                rows={2}
              />
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={goBackToCart} className="bg-transparent gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button 
                type="button"
                onClick={handleFinalize}
                disabled={loading || !formaPagamento} 
                className="bg-success text-success-foreground gap-2"
              >
                {loading ? 'Finalizando...' : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Finalizar Venda
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && lastVenda && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Venda #{lastVenda.numero} Finalizada!
              </h3>
              <p className="text-muted-foreground">
                Total: <span className="font-bold text-primary">{formatCurrency(total)}</span>
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Deseja imprimir o cupom?</h4>
              <p className="text-xs text-muted-foreground">
                O cupom sera impresso no formato de bobina termica (80mm) sem valor fiscal.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                type="button"
                onClick={handleFinishWithPrint}
                className="w-full bg-primary text-primary-foreground gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Cupom e Fechar
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleFinishWithoutPrint}
                className="w-full bg-transparent"
              >
                Fechar sem Imprimir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
