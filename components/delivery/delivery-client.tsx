'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Clock, ChefHat, Bike, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FiltroButton } from '@/components/shared/filtro-button'
import { DeliveryList } from '@/components/delivery/delivery-list'
import { NovoPedidoButton } from '@/components/delivery/novo-pedido-button'
import { DeliveryStats } from '@/components/delivery/delivery-stats'
import type { DeliveryPedido, Produto, Cliente } from '@/lib/types'

interface DeliveryClientProps {
  pedidosIniciais: DeliveryPedido[]
  produtosIniciais: Produto[]
  clientesIniciais: Cliente[]
  userId: string
}

export function DeliveryClient({
  pedidosIniciais,
  produtosIniciais,
  clientesIniciais,
  userId,
}: DeliveryClientProps) {
  const [pedidos, setPedidos] = useState<DeliveryPedido[]>(pedidosIniciais)
  const [produtos] = useState<Produto[]>(produtosIniciais)
  const [clientes] = useState<Cliente[]>(clientesIniciais)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pendentes')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('delivery_pedidos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setPedidos(data)
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    const channel = supabase
      .channel('delivery_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_pedidos' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchData])

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch =
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.endereco?.toLowerCase().includes(search.toLowerCase()) ||
      p.numero?.toString().includes(search)

    switch (activeTab) {
      case 'pendentes':
        return matchesSearch && p.status === 'pendente'
      case 'cozinha':
        return matchesSearch && (p.status === 'confirmado' || p.status === 'preparando')
      case 'em_rota':
        return matchesSearch && p.status === 'saiu_entrega'
      case 'entregues':
        return matchesSearch && p.status === 'entregue'
      case 'cancelados':
        return matchesSearch && p.status === 'cancelado'
      default:
        return matchesSearch
    }
  })

  const pendentes = pedidos.filter(p => p.status === 'pendente')
  const naCozinha = pedidos.filter(p => p.status === 'confirmado' || p.status === 'preparando')
  const emRota = pedidos.filter(p => p.status === 'saiu_entrega')
  const entreguesHoje = pedidos.filter(p => {
    if (p.status !== 'entregue') return false
    return new Date(p.created_at).toDateString() === new Date().toDateString()
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-3">
          <FiltroButton />
          <NovoPedidoButton produtos={produtos} clientes={clientes} onSuccess={fetchData} />
        </div>
      </div>

      <DeliveryStats
        pendentes={pendentes.length}
        entreguesHoje={entreguesHoje.length}
        totalHoje={entreguesHoje.reduce((acc, p) => acc + p.total, 0)}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card">
          <TabsTrigger value="pendentes" className="relative gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {pendentes.length > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendentes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cozinha" className="relative gap-2">
            <ChefHat className="h-4 w-4" />
            Na Cozinha
            {naCozinha.length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {naCozinha.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="em_rota" className="relative gap-2">
            <Bike className="h-4 w-4" />
            Em Rota
            {emRota.length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {emRota.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="entregues" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Entregues
          </TabsTrigger>
          <TabsTrigger value="cancelados">Cancelados</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-6">
          <DeliveryList pedidos={filteredPedidos} loading={loading} onUpdate={fetchData} showActions currentTab="pendentes" />
        </TabsContent>
        <TabsContent value="cozinha" className="mt-6">
          <DeliveryList pedidos={filteredPedidos} loading={loading} onUpdate={fetchData} showActions currentTab="cozinha" />
        </TabsContent>
        <TabsContent value="em_rota" className="mt-6">
          <DeliveryList pedidos={filteredPedidos} loading={loading} onUpdate={fetchData} showActions currentTab="em_rota" />
        </TabsContent>
        <TabsContent value="entregues" className="mt-6">
          <DeliveryList pedidos={filteredPedidos} loading={loading} onUpdate={fetchData} />
        </TabsContent>
        <TabsContent value="cancelados" className="mt-6">
          <DeliveryList pedidos={filteredPedidos} loading={loading} onUpdate={fetchData} />
        </TabsContent>
      </Tabs>
    </>
  )
}
