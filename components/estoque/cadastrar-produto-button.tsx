'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Plus, AlertCircle } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import type { Fornecedor } from '@/lib/types'

const unidades = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct']

export function CadastrarProdutoButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id || null)
      } catch {
        setUserId(null)
      }
    }
    checkUser()
  }, [])

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
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Você precisa estar logado para cadastrar produtos. Acesse /auth/login para entrar.')
        setLoading(false)
        return
      }

      const fornecedorId = formData.get('fornecedor_id') as string
      
      const { error: insertError } = await supabase.from('estoque').insert({
        user_id: user.id,
        nome: formData.get('nome') as string,
        quantidade: 0, 
        unidade: formData.get('unidade') as string,
        quantidade_minima: Number(formData.get('quantidade_minima')) || 10,
        custo_unitario: 0, 
      })

      setLoading(false)

      if (insertError) {
        setError(insertError.message)
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch {
      setLoading(false)
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Produto no Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!userId && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você precisa estar logado para cadastrar produtos.{' '}
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
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input id="nome" name="nome" required placeholder="Ex: Farinha de Trigo" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade_minima">Quantidade Mínima</Label>
              <Input 
                id="quantidade_minima" 
                name="quantidade_minima" 
                type="number" 
                step="0.001" 
                min="0" 
                defaultValue="10"
                placeholder="10" 
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade *</Label>
              <Select name="unidade" defaultValue="un">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((un) => (
                    <SelectItem key={un} value={un}>
                      {un}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU (Código de Identificação)</Label>
            <Input 
              id="sku" 
              name="sku" 
              placeholder="Ex: FAR-001" 
            />
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select name="fornecedor_id" defaultValue="none">
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum fornecedor</SelectItem>
                {fornecedores.map((fornecedor) => (
                  <SelectItem key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fornecedores.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Cadastre fornecedores no botão "Fornecedores" acima
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
