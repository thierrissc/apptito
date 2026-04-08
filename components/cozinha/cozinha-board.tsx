'use client'

import React from "react"
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChefHat, Clock, CheckCircle, AlertCircle, Utensils, Bike, MapPin, Printer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { abaterEstoqueComanda } from '@/lib/actions/estoque-actions'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCurrency } from '@/lib/formatters'
import type { DeliveryPedido, DeliveryItem } from '@/lib/types'
import { printCozinha } from '@/lib/print-utils'

interface ComandaItem {
  id: string
  comanda_id: string
  produto_id: string | null
  nome_produto: string
  quantidade: number
  observacoes: string | null
  status: 'pendente' | 'preparando' | 'pronto' | 'entregue' | 'cancelado'
  estoque_abatido: boolean
  created_at: string
  comanda?: {
    id: string
    numero: number
    mesa: string | null
    status: string
  }
  produto?: {
    id: string
    nome: string
    tempo_preparo: number
  }
}

interface CozinhaBoardProps {
  itens: ComandaItem[]
  pedidosDelivery?: DeliveryPedido[]
}

export function CozinhaBoard({ itens, pedidosDelivery = [] }: CozinhaBoardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('comandas')
  const [localItens, setLocalItens] = useState<ComandaItem[]>(itens)
  const [localDeliveries, setLocalDeliveries] = useState<DeliveryPedido[]>(pedidosDelivery)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  React.useEffect(() => {
    async function fetchFreshData() {
      const { data: comandasAbertas } = await supabase
        .from('comandas')
        .select('id')
        .eq('status', 'aberta')

      const comandaIds = (comandasAbertas || []).map(c => c.id)

      const [{ data: itensData }, { data: deliveryData }] = await Promise.all([
        comandaIds.length > 0
          ? supabase
              .from('comanda_itens')
              .select('*, comanda:comandas(id, numero, mesa, status), produto:produtos(id, nome, tempo_preparo)')
              .in('comanda_id', comandaIds)
              .in('status', ['pendente', 'preparando', 'pronto'])
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] as ComandaItem[], error: null }),
        supabase
          .from('delivery_pedidos')
          .select('*')
          .in('status', ['confirmado', 'preparando'])
          .order('created_at', { ascending: true }),
      ])

      if (itensData) setLocalItens(itensData as ComandaItem[])
      if (deliveryData) setLocalDeliveries(deliveryData)
    }
    fetchFreshData()
  }, [])

  React.useEffect(() => {
    const channel = supabase
      .channel('comanda_itens_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comanda_itens' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ComandaItem
            setLocalItens(prev => {
              if (updated.status === 'entregue' || updated.status === 'cancelado') {
                return prev.filter(item => item.id !== updated.id)
              }
              return prev.map(item => item.id === updated.id ? { ...item, ...updated } : item)
            })
          } else if (payload.eventType === 'INSERT') {
            supabase
              .from('comanda_itens')
              .select('*, comanda:comandas(id, numero, mesa, status), produto:produtos(id, nome, tempo_preparo)')
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data && data.status !== 'entregue' && data.status !== 'cancelado') {
                  setLocalItens(prev => [...prev, data as ComandaItem])
                }
              })
          }
        }
      )
      .subscribe()

    const deliveryChannel = supabase
      .channel('delivery_pedidos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_pedidos' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DeliveryPedido
            setLocalDeliveries(prev => {
              if (!['confirmado', 'preparando'].includes(updated.status)) {
                return prev.filter(p => p.id !== updated.id)
              }
              return prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(deliveryChannel)
    }
  }, [])

  const pendentes = localItens.filter(i => i.status === 'pendente')
  const preparando = localItens.filter(i => i.status === 'preparando')
  const prontos = localItens.filter(i => i.status === 'pronto')

  const deliveryConfirmados = localDeliveries.filter(p => p.status === 'confirmado')
  const deliveryPreparando = localDeliveries.filter(p => p.status === 'preparando')

  const handleIniciarPreparo = async (item: ComandaItem) => {
    setLoading(item.id)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('comanda_itens')
        .update({ status: 'preparando' })
        .eq('id', item.id)

      if (updateError) {
        setError('Erro ao atualizar status do item')
        setLoading(null)
        return
      }

      abaterEstoqueComanda(item.id, item.quantidade).then(result => {
        if (result.error) {
          console.warn('Aviso estoque:', result.error)
        }
      })

      setLocalItens(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: 'preparando' as const } : i)
      )
    } finally {
      setLoading(null)
    }
  }

  const handleMarcarPronto = async (item: ComandaItem) => {
    setLoading(item.id)

    try {
      await supabase
        .from('comanda_itens')
        .update({ status: 'pronto' })
        .eq('id', item.id)

      setLocalItens(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: 'pronto' as const } : i)
      )
    } finally {
      setLoading(null)
    }
  }

  const handleMarcarEntregue = async (item: ComandaItem) => {
    setLoading(item.id)

    try {
      await supabase
        .from('comanda_itens')
        .update({ status: 'entregue' })
        .eq('id', item.id)

      setLocalItens(prev =>
        prev.map(i => i.id === item.id ? { ...i, status: 'entregue' as const } : i)
      )
    } finally {
      setLoading(null)
    }
  }

  const handleDeliveryIniciarPreparo = async (pedido: DeliveryPedido) => {
    setLoading(pedido.id)
    
    try {
      await supabase
        .from('delivery_pedidos')
        .update({ status: 'preparando' })
        .eq('id', pedido.id)

      setLocalDeliveries(prev =>
        prev.map(p => p.id === pedido.id ? { ...p, status: 'preparando' as const } : p)
      )
    } finally {
      setLoading(null)
    }
  }

  const handleDeliveryPronto = async (pedido: DeliveryPedido) => {
    setLoading(pedido.id)
    
    try {
      await supabase
        .from('delivery_pedidos')
        .update({ status: 'saiu_entrega' })
        .eq('id', pedido.id)

      setLocalDeliveries(prev =>
        prev.map(p => p.id === pedido.id ? { ...p, status: 'saiu_entrega' as const } : p)
      )
    } finally {
      setLoading(null)
    }
  }

  const getTempoEspera = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { 
      addSuffix: false, 
      locale: ptBR 
    })
  }

  const handlePrintComandaItem = (item: ComandaItem) => {
    printCozinha({
      numero: item.comanda?.numero || 0,
      mesa: item.comanda?.mesa,
      tipo: 'comanda',
      itens: [{
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        observacoes: item.observacoes
      }],
      created_at: item.created_at,
      setor: 'Cozinha'
    })
  }

  const handlePrintDelivery = async (pedido: DeliveryPedido) => {
    const { data: itens } = await supabase
      .from('delivery_itens')
      .select('*')
      .eq('pedido_id', pedido.id)

    printCozinha({
      numero: pedido.numero,
      tipo: 'delivery',
      cliente_nome: pedido.cliente_nome,
      endereco: [pedido.endereco, pedido.bairro].filter(Boolean).join(', '),
      itens: (itens || []).map((item: DeliveryItem) => ({
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        observacoes: item.observacoes
      })),
      created_at: pedido.created_at,
      observacoes: pedido.observacoes,
      setor: 'Cozinha'
    })
  }

  const renderComandaCard = (
    item: ComandaItem, 
    actionButton: React.ReactNode,
    variant: 'pending' | 'preparing' | 'ready'
  ) => {
    const tempoEspera = getTempoEspera(item.created_at)
    
    const bgColors = {
      pending: 'bg-card',
      preparing: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      ready: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
    }

    return (
      <Card key={item.id} className={`${bgColors[variant]} transition-all`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  #{item.comanda?.numero}
                </Badge>
                {item.comanda?.mesa && (
                  <Badge variant="secondary">Mesa {item.comanda.mesa}</Badge>
                )}
              </div>
              <h3 className="font-semibold mt-2 text-lg">
                {item.quantidade}x {item.nome_produto}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handlePrintComandaItem(item)}
                title="Imprimir pedido"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {tempoEspera}
                </div>
                {item.produto?.tempo_preparo && (
                  <div className="text-xs">
                    ~{item.produto.tempo_preparo}min preparo
                  </div>
                )}
              </div>
            </div>
          </div>

          {item.observacoes && (
            <div className="text-sm bg-muted p-2 rounded">
              <span className="font-medium">Obs:</span> {item.observacoes}
            </div>
          )}

          {error && loading === item.id && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="pt-2">
            {actionButton}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderDeliveryCard = (
    pedido: DeliveryPedido,
    actionButton: React.ReactNode,
    variant: 'pending' | 'preparing'
  ) => {
    const tempoEspera = getTempoEspera(pedido.created_at)
    
    const bgColors = {
      pending: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
      preparing: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
    }

    return (
      <Card key={pedido.id} className={`${bgColors[variant]} transition-all`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-600 text-white font-mono">
                  <Bike className="h-3 w-3 mr-1" />
                  #{pedido.numero}
                </Badge>
              </div>
              <h3 className="font-semibold mt-2">{pedido.cliente_nome}</h3>
              <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{pedido.endereco}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handlePrintDelivery(pedido)}
                title="Imprimir pedido"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {tempoEspera}
                </div>
                <div className="text-xs font-medium text-primary mt-1">
                  {formatCurrency(pedido.total)}
                </div>
              </div>
            </div>
          </div>

          {pedido.observacoes && (
            <div className="text-sm bg-muted p-2 rounded">
              <span className="font-medium">Obs:</span> {pedido.observacoes}
            </div>
          )}

          <div className="pt-2">
            {actionButton}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="comandas" className="gap-2">
            <Utensils className="h-4 w-4" />
            Comandas
            {(pendentes.length + preparando.length + prontos.length) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendentes.length + preparando.length + prontos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivery" className="gap-2">
            <Bike className="h-4 w-4" />
            Delivery
            {(deliveryConfirmados.length + deliveryPreparando.length) > 0 && (
              <Badge className="ml-1 bg-purple-600">
                {deliveryConfirmados.length + deliveryPreparando.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comandas" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Pendentes
                    <Badge variant="secondary" className="ml-auto">
                      {pendentes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <div className="space-y-3">
                {pendentes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido pendente</p>
                  </div>
                ) : (
                  pendentes.map(item => renderComandaCard(
                    item,
                    <Button 
                      className="w-full"
                      onClick={() => handleIniciarPreparo(item)}
                      disabled={loading === item.id}
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      {loading === item.id ? 'Iniciando...' : 'Iniciar Preparo'}
                    </Button>,
                    'pending'
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-amber-100/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                    <ChefHat className="h-5 w-5" />
                    Preparando
                    <Badge className="ml-auto bg-amber-500">
                      {preparando.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <div className="space-y-3">
                {preparando.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido em preparo</p>
                  </div>
                ) : (
                  preparando.map(item => renderComandaCard(
                    item,
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleMarcarPronto(item)}
                      disabled={loading === item.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {loading === item.id ? 'Finalizando...' : 'Marcar Pronto'}
                    </Button>,
                    'preparing'
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-emerald-100/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400">
                    <CheckCircle className="h-5 w-5" />
                    Prontos
                    <Badge className="ml-auto bg-emerald-500">
                      {prontos.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <div className="space-y-3">
                {prontos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido pronto</p>
                  </div>
                ) : (
                  prontos.map(item => renderComandaCard(
                    item,
                    <Button 
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => handleMarcarEntregue(item)}
                      disabled={loading === item.id}
                    >
                      {loading === item.id ? 'Entregando...' : 'Marcar Entregue'}
                    </Button>,
                    'ready'
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="bg-purple-100/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-400">
                    <Clock className="h-5 w-5" />
                    Aguardando Preparo
                    <Badge className="ml-auto bg-purple-600">
                      {deliveryConfirmados.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <div className="space-y-3">
                {deliveryConfirmados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bike className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido aguardando</p>
                  </div>
                ) : (
                  deliveryConfirmados.map(pedido => renderDeliveryCard(
                    pedido,
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleDeliveryIniciarPreparo(pedido)}
                      disabled={loading === pedido.id}
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      {loading === pedido.id ? 'Iniciando...' : 'Iniciar Preparo'}
                    </Button>,
                    'pending'
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-amber-100/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                    <ChefHat className="h-5 w-5" />
                    Preparando
                    <Badge className="ml-auto bg-amber-500">
                      {deliveryPreparando.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              
              <div className="space-y-3">
                {deliveryPreparando.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum pedido em preparo</p>
                  </div>
                ) : (
                  deliveryPreparando.map(pedido => renderDeliveryCard(
                    pedido,
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleDeliveryPronto(pedido)}
                      disabled={loading === pedido.id}
                    >
                      <Bike className="h-4 w-4 mr-2" />
                      {loading === pedido.id ? 'Enviando...' : 'Saiu para Entrega'}
                    </Button>,
                    'preparing'
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
