'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
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
import { formatCurrency } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Caixa } from '@/lib/types'

interface FecharCaixaButtonProps {
  caixa: Caixa
  totalEntradas: number
  totalSaidas: number
}

export function FecharCaixaButton({ caixa, totalEntradas, totalSaidas }: FecharCaixaButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [valorFinal, setValorFinal] = useState('')
  const router = useRouter()

  const saldoEsperado = Number(caixa.valor_inicial) + totalEntradas - totalSaidas
  const diferenca = valorFinal ? Number(valorFinal) - saldoEsperado : 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from('caixa').update({
      data_fechamento: new Date().toISOString(),
      valor_final: Number(formData.get('valor_final')),
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      diferenca: diferenca,
      status: 'fechado',
      observacoes: formData.get('observacoes') as string || null,
    }).eq('id', caixa.id)

    setLoading(false)

    if (!error) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-destructive text-destructive bg-transparent hover:bg-destructive/10">
          <Lock className="h-4 w-4" />
          Fechar Caixa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Inicial</span>
              <span className="font-medium text-foreground">{formatCurrency(caixa.valor_inicial)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Entradas</span>
              <span className="font-medium text-success">{formatCurrency(totalEntradas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Saídas</span>
              <span className="font-medium text-destructive">{formatCurrency(totalSaidas)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-medium text-foreground">Saldo Esperado</span>
              <span className="font-bold text-primary">{formatCurrency(saldoEsperado)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_final">Valor Final Contado (R$)</Label>
            <Input 
              id="valor_final" 
              name="valor_final" 
              type="number" 
              step="0.01" 
              min="0" 
              required 
              placeholder="0,00"
              value={valorFinal}
              onChange={(e) => setValorFinal(e.target.value)}
            />
          </div>

          {valorFinal && (
            <div className={`rounded-lg p-3 ${diferenca >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-sm">
                Diferença: <span className={`font-bold ${diferenca >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {diferenca >= 0 ? '+' : ''}{formatCurrency(diferenca)}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea 
              id="observacoes" 
              name="observacoes" 
              placeholder="Anotações sobre o fechamento" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-destructive text-destructive-foreground">
              {loading ? 'Fechando...' : 'Fechar Caixa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
