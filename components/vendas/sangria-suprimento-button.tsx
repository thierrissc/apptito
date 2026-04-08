'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Caixa } from '@/lib/types'

interface SangriaSuprimentoButtonProps {
  caixa: Caixa
  saldoAtual: number
}

export function SangriaSuprimentoButton({ caixa, saldoAtual }: SangriaSuprimentoButtonProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<'sangria' | 'suprimento'>('sangria')
  const [loading, setLoading] = useState(false)
  const [valor, setValor] = useState('')
  const router = useRouter()

  function openDialog(operacao: 'sangria' | 'suprimento') {
    setTipo(operacao)
    setValor('')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const valorNum = Number(formData.get('valor'))
    const justificativa = formData.get('justificativa') as string

    if (tipo === 'sangria' && valorNum > saldoAtual) {
      alert('Valor da sangria maior que o saldo disponível em caixa!')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { error: movError } = await supabase.from('caixa_movimentacao').insert({
      user_id: user.id,
      caixa_id: caixa.id,
      tipo,
      valor: valorNum,
      justificativa,
    })

    if (movError) {
      console.error('Erro ao registrar movimentação:', movError)
      setLoading(false)
      return
    }

    const updateData = tipo === 'sangria'
      ? { total_sangrias: Number(caixa.total_sangrias || 0) + valorNum }
      : { total_suprimentos: Number(caixa.total_suprimentos || 0) + valorNum }

    await supabase.from('caixa').update(updateData).eq('id', caixa.id)

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="gap-2 border-amber-500 text-amber-600 bg-transparent hover:bg-amber-500/10"
          onClick={() => openDialog('sangria')}
        >
          <ArrowUpCircle className="h-4 w-4" />
          Sangria
        </Button>
        <Button 
          variant="outline" 
          className="gap-2 border-emerald-500 text-emerald-600 bg-transparent hover:bg-emerald-500/10"
          onClick={() => openDialog('suprimento')}
        >
          <ArrowDownCircle className="h-4 w-4" />
          Suprimento
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={tipo === 'sangria' ? 'text-amber-600' : 'text-emerald-600'}>
              {tipo === 'sangria' ? 'Sangria de Caixa' : 'Suprimento de Caixa'}
            </DialogTitle>
            <DialogDescription>
              {tipo === 'sangria' 
                ? 'Retirada de dinheiro físico do caixa' 
                : 'Entrada de dinheiro físico no caixa'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Saldo Atual em Dinheiro</span>
                <span className="font-bold text-lg text-foreground">{formatCurrency(saldoAtual)}</span>
              </div>
              {valor && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">Saldo Após {tipo === 'sangria' ? 'Sangria' : 'Suprimento'}</span>
                  <span className={`font-bold text-lg ${tipo === 'sangria' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {formatCurrency(tipo === 'sangria' ? saldoAtual - Number(valor) : saldoAtual + Number(valor))}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input 
                id="valor" 
                name="valor" 
                type="number" 
                step="0.01" 
                min="0.01" 
                max={tipo === 'sangria' ? saldoAtual : undefined}
                required 
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="text-lg"
              />
              {tipo === 'sangria' && valor && Number(valor) > saldoAtual && (
                <p className="text-sm text-destructive">Valor maior que o saldo disponível</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa *</Label>
              <Textarea 
                id="justificativa" 
                name="justificativa" 
                required
                placeholder={tipo === 'sangria' 
                  ? "Ex: Pagamento de fornecedor, troco para loja vizinha..." 
                  : "Ex: Reforço de troco, devolução de valor..."}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || (tipo === 'sangria' && Number(valor) > saldoAtual)}
                className={tipo === 'sangria' 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'}
              >
                {loading ? 'Registrando...' : `Confirmar ${tipo === 'sangria' ? 'Sangria' : 'Suprimento'}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
