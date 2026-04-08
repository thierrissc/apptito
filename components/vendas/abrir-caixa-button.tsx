'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign } from 'lucide-react'
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
import type { Funcionario } from '@/lib/types'

interface AbrirCaixaButtonProps {
  funcionarios: Funcionario[]
}

export function AbrirCaixaButton({ funcionarios }: AbrirCaixaButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

    const { error } = await supabase.from('caixa').insert({
      user_id: user.id,
      funcionario_id: formData.get('funcionario_id') as string || null,
      data_abertura: new Date().toISOString(),
      valor_inicial: Number(formData.get('valor_inicial')),
      status: 'aberto',
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
        <Button className="bg-success text-success-foreground gap-2">
          <DollarSign className="h-4 w-4" />
          Abrir Caixa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select name="funcionario_id">
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
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

          <div className="space-y-2">
            <Label htmlFor="valor_inicial">Valor Inicial (R$)</Label>
            <Input 
              id="valor_inicial" 
              name="valor_inicial" 
              type="number" 
              step="0.01" 
              min="0" 
              required 
              defaultValue="0"
              placeholder="0,00" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-success text-success-foreground">
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
