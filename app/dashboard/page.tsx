import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { EstoqueBaixo } from '@/components/dashboard/estoque-baixo'
import { MaisVendidos } from '@/components/dashboard/mais-vendidos'
import { ComandasWidget } from '@/components/dashboard/comandas-widget'
import { TopClientes } from '@/components/dashboard/top-clientes'
import { UltimasTransacoes } from '@/components/dashboard/ultimas-transacoes'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  
  const uid = userInfo.effectiveUserId
  const profile = await getProfileForDisplay()

  const hoje = new Date().toISOString().split('T')[0]
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: entradas },
    { data: saidas },
    { data: comandas },
    { data: estoqueBaixo },
    { data: produtos },
    { data: comandasAbertas },
    { data: comandasPagas },
    { data: topClientes },
    { data: transacoes },
  ] = await Promise.all([
    supabase.from('transacoes').select('valor').eq('user_id', uid).eq('tipo', 'entrada').gte('data', inicioMes),
    supabase.from('transacoes').select('valor').eq('user_id', uid).eq('tipo', 'saida').gte('data', inicioMes),
    supabase.from('comandas').select('total').eq('user_id', uid).eq('status', 'fechada').gte('created_at', inicioMes),
    supabase.from('estoque').select('*').eq('user_id', uid).lt('quantidade', 10).order('quantidade', { ascending: true }).limit(5),
    supabase.from('produtos').select('*, categoria:categorias(nome)').eq('user_id', uid).eq('disponivel', true).order('created_at', { ascending: false }).limit(10),
    supabase.from('comandas').select('*, funcionario:funcionarios(nome)').eq('user_id', uid).eq('status', 'aberta').order('created_at', { ascending: false }).limit(5),
    supabase.from('comandas').select('*, funcionario:funcionarios(nome)').eq('user_id', uid).eq('status', 'fechada').gte('fechada_em', hoje).order('fechada_em', { ascending: false }).limit(5),
    supabase.from('clientes').select('*').eq('user_id', uid).gt('quantidade_compras', 0).order('total_compras', { ascending: false }).limit(3),
    supabase.from('transacoes').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
  ])

  const totalEntradas = entradas?.reduce((acc, t) => acc + Number(t.valor), 0) || 0
  const totalSaidas = saidas?.reduce((acc, t) => acc + Number(t.valor), 0) || 0
  const totalVendas = comandas?.length || 0
  const faturamento = totalEntradas
  const lucroLiquido = totalEntradas - totalSaidas
  const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0

  return (
    <div className="space-y-6">
      <Header title="Dashboard" profile={profile} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardStats
            faturamento={faturamento}
            vendas={totalVendas}
            lucroLiquido={lucroLiquido}
            ticketMedio={ticketMedio}
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <EstoqueBaixo items={estoqueBaixo || []} />
            <MaisVendidos produtos={produtos || []} />
          
          </div>
          <UltimasTransacoes transacoes={transacoes || []} />
        </div>

        <div className="space-y-6">
          <ComandasWidget 
            abertas={comandasAbertas || []} 
            pagas={comandasPagas || []} 
          />
          <TopClientes clientes={topClientes || []} />
        </div>
      </div>
    </div>
  )
}
