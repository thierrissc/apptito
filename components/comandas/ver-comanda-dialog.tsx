'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChefHat, CheckCircle, Printer } from 'lucide-react'
import type { Comanda, ComandaItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { printComanda } from '@/lib/print-utils'

interface VerComandaDialogProps {
  comanda: Comanda
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerComandaDialog({ comanda, open, onOpenChange }: VerComandaDialogProps) {
  const [itens, setItens] = useState<ComandaItem[]>([])
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  useEffect(() => {
    async function loadItens() {
      const { data } = await supabase
        .from('comanda_itens')
        .select('*')
        .eq('comanda_id', comanda.id)
        .order('created_at', { ascending: true })
      
      setItens(data || [])
    }
    
    if (open) {
      loadItens()
    }
  }, [comanda.id, open])

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
      desconto: comanda.desconto,
      taxa_servico: comanda.taxa_servico,
      total: comanda.total,
      forma_pagamento: comanda.forma_pagamento,
      created_at: comanda.created_at,
      observacoes: comanda.observacoes
    }, true) 
  }

  useEffect(() => {
    if (!open) return

    const channel = supabase
      .channel(`comanda_itens_dialog_${comanda.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comanda_itens' },
        (payload) => {
          const updated = payload.new as ComandaItem
          // Filtrar apenas itens desta comanda
          if (updated.comanda_id !== comanda.id) return
          setItens(prev =>
            prev.map(item => item.id === updated.id ? { ...item, ...updated } : item)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [comanda.id, open])

  // Calcular status geral da cozinha
  const getKitchenStatus = () => {
    if (itens.length === 0) return { status: 'vazio', label: 'Sem itens', color: 'bg-gray-100 text-gray-700' }
    
    const todos = itens.filter(i => i.status !== 'cancelado')
    if (todos.length === 0) return { status: 'vazio', label: 'Todos cancelados', color: 'bg-gray-100 text-gray-700' }

    const pendentes = todos.filter(i => i.status === 'pendente')
    const preparando = todos.filter(i => i.status === 'preparando')
    const prontos = todos.filter(i => i.status === 'pronto')

    if (pendentes.length > 0) {
      return { status: 'pendente', label: `${pendentes.length} aguardando`, color: 'bg-amber-100 text-amber-700' }
    }
    if (preparando.length > 0) {
      return { status: 'preparando', label: `${preparando.length} preparando`, color: 'bg-orange-100 text-orange-700' }
    }
    if (prontos.length > 0) {
      return { status: 'pronto', label: 'Tudo pronto', color: 'bg-emerald-100 text-emerald-700' }
    }
    
    return { status: 'entregue', label: 'Entregue', color: 'bg-blue-100 text-blue-700' }
  }

  const statusConfig = {
    aberta: { label: 'Aberta', className: 'bg-primary/10 text-primary' },
    fechada: { label: 'Fechada', className: 'bg-success/10 text-success' },
    cancelada: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive' },
  }

  function ItemStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      pendente: { label: 'Aguardando', icon: <Clock className="h-3 w-3" />, color: 'bg-amber-100 text-amber-700' },
      preparando: { label: 'Preparando', icon: <ChefHat className="h-3 w-3" />, color: 'bg-orange-100 text-orange-700' },
      pronto: { label: 'Pronto', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-emerald-100 text-emerald-700' },
      entregue: { label: 'Entregue', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700' },
      cancelado: { label: 'Cancelado', icon: null, color: 'bg-gray-100 text-gray-700' },
    }

    const itemConfig = config[status] || config.pendente

    return (
      <Badge className={`flex items-center gap-1 text-xs ${itemConfig.color} border-0`}>
        {itemConfig.icon}
        {itemConfig.label}
      </Badge>
    )
  }

  function KitchenStatusBadge({ status }: { status: ReturnType<typeof getKitchenStatus> }) {
    const icons: Record<string, React.ReactNode> = {
      pendente: <Clock className="h-3 w-3" />,
      preparando: <ChefHat className="h-3 w-3" />,
      pronto: <CheckCircle className="h-3 w-3" />,
      entregue: <CheckCircle className="h-3 w-3" />,
      vazio: null,
    }

    return (
      <Badge className={`flex items-center gap-1 text-xs ${status.color} border-0`}>
        {icons[status.status]}
        {status.label}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              Comanda #{comanda.numero}
              <Badge className={statusConfig[comanda.status].className}>
                {statusConfig[comanda.status].label}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              disabled={itens.length === 0}
              className="bg-transparent gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Abertura</p>
              <p className="font-medium text-foreground">{formatDateTime(comanda.created_at)}</p>
            </div>
            {comanda.fechada_em && (
              <div>
                <p className="text-muted-foreground">Fechamento</p>
                <p className="font-medium text-foreground">{formatDateTime(comanda.fechada_em)}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Responsável</p>
              <p className="font-medium text-foreground">{comanda.funcionario?.nome || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mesa</p>
              <p className="font-medium text-foreground">{comanda.mesa || 'Balcão'}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">Itens</h4>
              {itens.length > 0 && (
                <KitchenStatusBadge status={getKitchenStatus()} />
              )}
            </div>
            
            {itens.length === 0 ? (
              <p className="text-sm text-muted-foreground">Carregando itens...</p>
            ) : (
              <div className="space-y-2">
                {itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.nome_produto}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantidade}x {formatCurrency(item.preco_unitario)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <ItemStatusBadge status={item.status} />
                      <p className="font-medium text-foreground">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(comanda.subtotal)}</span>
            </div>
            {comanda.desconto > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-destructive">-{formatCurrency(comanda.desconto)}</span>
              </div>
            )}
            {comanda.taxa_servico > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Serviço</span>
                <span className="text-foreground">{formatCurrency(comanda.taxa_servico)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatCurrency(comanda.total)}</span>
            </div>
            {comanda.forma_pagamento && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Forma de Pagamento</span>
                <span className="text-foreground capitalize">{comanda.forma_pagamento.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
