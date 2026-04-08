'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import type { CategoriaFinanceira } from '@/lib/types'

const categoriasPadrao = {
  entrada: [
    { nome: 'Vendas', grupo_dre: 'receita_bruta' },
    { nome: 'Serviços', grupo_dre: 'receita_bruta' },
    { nome: 'Outros', grupo_dre: 'receita_bruta' },
  ],
  saida: [
    { nome: 'Compras', grupo_dre: 'cmv' },
    { nome: 'Insumos', grupo_dre: 'cmv' },
    { nome: 'Água', grupo_dre: 'despesas_fixas' },
    { nome: 'Luz', grupo_dre: 'despesas_fixas' },
    { nome: 'Aluguel', grupo_dre: 'despesas_fixas' },
    { nome: 'Salários', grupo_dre: 'despesas_fixas' },
    { nome: 'Impostos', grupo_dre: 'deducoes' },
    { nome: 'Taxas de Apps', grupo_dre: 'deducoes' },
    { nome: 'Estornos', grupo_dre: 'deducoes' },
    { nome: 'Taxas Bancárias', grupo_dre: 'despesas_financeiras' },
    { nome: 'Juros', grupo_dre: 'despesas_financeiras' },
    { nome: 'Outros', grupo_dre: 'despesas_fixas' },
  ],
}

export function NovaTransacaoButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
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
      .order('nome', { ascending: true })
    
    if (data) {
      setCategorias(data)
    }
  }

  const categoriasDoTipo = categorias.filter(c => c.tipo === tipo)
  const usarCategoriasPadrao = categoriasDoTipo.length === 0

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

    const { error } = await supabase.from('transacoes').insert({
      user_id: user.id,
      tipo,
      categoria: formData.get('categoria') as string,
      descricao: formData.get('descricao') as string,
      valor: Number(formData.get('valor')),
      data: formData.get('data') as string,
      hora: new Date().toTimeString().slice(0, 5),
      forma_pagamento: formData.get('forma_pagamento') as string,
    })

    setLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as 'entrada' | 'saida')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select name="categoria" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {usarCategoriasPadrao ? (
                    categoriasPadrao[tipo].map((cat) => (
                      <SelectItem key={cat.nome} value={cat.nome}>
                        {cat.nome}
                      </SelectItem>
                    ))
                  ) : (
                    categoriasDoTipo.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" required placeholder="Ex: Pagamento Água" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input 
                id="valor" 
                name="valor" 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                placeholder="0,00" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input 
                id="data" 
                name="data" 
                type="date" 
                required 
                defaultValue={new Date().toISOString().split('T')[0]} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select name="forma_pagamento">
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
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
