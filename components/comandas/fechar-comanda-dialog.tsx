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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Printer, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { fecharComanda } from '@/lib/actions/estoque-actions'
import type { Comanda, ComandaItem } from '@/lib/types'
import { printComanda } from '@/lib/print-utils'
import { createClient } from '@/lib/supabase/client'

interface FecharComandaDialogProps {
  comanda: Comanda
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FecharComandaDialog({ comanda, open, onOpenChange }: FecharComandaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [desconto, setDesconto] = useState('0')
  const [taxaServico, setTaxaServico] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [itens, setItens] = useState<ComandaItem[]>([])
  const [formaPagamentoFinal, setFormaPagamentoFinal] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    async function loadItens() {
      const { data } = await supabase
        .from('comanda_itens')
        .select('*')
        .eq('comanda_id', comanda.id)
      setItens(data || [])
    }
    if (open) {
      loadItens()
      setSuccess(false)
      setDesconto('0')
      setTaxaServico('0')
      setError(null)
    }
  }, [comanda.id, open])

  const descontoNum = Number(desconto) || 0
  const taxaServicoNum = Number(taxaServico) || 0
  const total = comanda.subtotal - descontoNum + taxaServicoNum

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const formaPagamento = formData.get('forma_pagamento') as string

    const result = await fecharComanda(comanda.id, formaPagamento, descontoNum, taxaServicoNum)

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setFormaPagamentoFinal(formaPagamento)
    setSuccess(true)
    router.refresh()
  }

  function handlePrint() {
    printComanda({
      numero: comanda.numero,
      mesa: comanda.mesa,
      cliente: comanda.cliente ? { 
        nome: comanda.cliente.nome, 
        telefone: comanda.cliente.telefone || undefined 
      } : null,
      funcionario: comanda.funcionario ? { nome: comanda.funcionario.nome } : null,
      itens: itens.map(item => ({
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        observacoes: item.observacoes
      })),
      subtotal: comanda.subtotal,
      desconto: descontoNum,
      taxa_servico: taxaServicoNum,
      total,
      forma_pagamento: formaPagamentoFinal,
      created_at: comanda.created_at,
      observacoes: comanda.observacoes
    })
  }

  function handleClose() {
    onOpenChange(false)
  }

  function handlePrintAndClose() {
    handlePrint()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {success ? 'Comanda Fechada' : `Fechar Comanda #${comanda.numero}`}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Comanda #{comanda.numero} Fechada!
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
                onClick={handlePrintAndClose}
                className="w-full bg-primary text-primary-foreground gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir Cupom e Fechar
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full bg-transparent"
              >
                Fechar sem Imprimir
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCurrency(comanda.subtotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto (R$)</Label>
              <Input 
                id="desconto" 
                type="number" 
                step="0.01" 
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxa_servico">Taxa Serviço (R$)</Label>
              <Input 
                id="taxa_servico" 
                type="number" 
                step="0.01" 
                min="0"
                value={taxaServico}
                onChange={(e) => setTaxaServico(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg bg-primary/10 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">Total a Pagar</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select name="forma_pagamento" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-success text-success-foreground">
              {loading ? 'Fechando...' : 'Fechar Comanda'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
