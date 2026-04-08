import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CaixaStatus } from '@/components/vendas/caixa-status'
import { VendasResumo } from '@/components/vendas/vendas-resumo'
import { AbrirCaixaButton } from '@/components/vendas/abrir-caixa-button'
import { FecharCaixaButton } from '@/components/vendas/fechar-caixa-button'
import { NovaVendaButton } from '@/components/vendas/nova-venda-button'
import { SangriaSuprimentoButton } from '@/components/vendas/sangria-suprimento-button'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

export default async function VendasPage() {
  const supabase = await createClient()
  
  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId
  
  const profile = await getProfileForDisplay()

  const [
    { data: caixaAberto },
    { data: produtos },
    { data: clientes },
    { data: funcionarios },
  ] = await Promise.all([
    supabase
      .from('caixa')
      .select('*, funcionario:funcionarios(nome)')
      .eq('user_id', uid)
      .eq('status', 'aberto')
      .order('data_abertura', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('produtos').select('*, categoria:categorias(nome)').eq('user_id', uid).eq('disponivel', true).order('nome', { ascending: true }),
    supabase.from('clientes').select('*').eq('user_id', uid).order('nome', { ascending: true }),
    supabase.from('funcionarios').select('*').eq('user_id', uid).eq('ativo', true).order('nome', { ascending: true }),
  ])

  const [{ data: transacoesHoje }, { data: comandasDia }] = await Promise.all([
    caixaAberto
      ? supabase.from('transacoes').select('*').eq('user_id', uid).gte('created_at', caixaAberto.data_abertura).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    caixaAberto
      ? supabase.from('comandas').select('*').eq('user_id', uid).gte('created_at', caixaAberto.data_abertura)
      : Promise.resolve({ data: [] }),
  ])

  const totalEntradas = transacoesHoje?.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0) || 0
  const totalSaidas = transacoesHoje?.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0) || 0

  const entradasDinheiro = transacoesHoje?.filter(t => t.tipo === 'entrada' && t.forma_pagamento === 'dinheiro').reduce((acc, t) => acc + Number(t.valor), 0) || 0
  const saidasDinheiro = transacoesHoje?.filter(t => t.tipo === 'saida' && t.forma_pagamento === 'dinheiro').reduce((acc, t) => acc + Number(t.valor), 0) || 0
  const saldoDinheiro = caixaAberto
    ? Number(caixaAberto.valor_inicial) + Number(caixaAberto.total_suprimentos || 0) - Number(caixaAberto.total_sangrias || 0) + entradasDinheiro - saidasDinheiro
    : 0

  const comandasAbertas = comandasDia?.filter(c => c.status === 'aberta').length || 0
  const comandasFechadas = comandasDia?.filter(c => c.status === 'fechada').length || 0

  return (
    <div className="space-y-6">
      <Header title="Vendas/Caixa" profile={profile}>
        {caixaAberto ? (
          <>
            <SangriaSuprimentoButton 
              caixa={caixaAberto}
              saldoAtual={saldoDinheiro}
            />
            <NovaVendaButton 
              produtos={produtos || []} 
              clientes={clientes || []}
              funcionarios={funcionarios || []}
            />
            <FecharCaixaButton 
              caixa={caixaAberto} 
              totalEntradas={totalEntradas}
              totalSaidas={totalSaidas}
            />
          </>
        ) : (
          <AbrirCaixaButton funcionarios={funcionarios || []} />
        )}
      </Header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CaixaStatus 
          caixa={caixaAberto}
          totalEntradas={totalEntradas}
          totalSaidas={totalSaidas}
          saldoDinheiro={saldoDinheiro}
        />
        <VendasResumo
          comandasAbertas={comandasAbertas}
          comandasFechadas={comandasFechadas}
          transacoes={transacoesHoje || []}
        />
      </div>
    </div>
  )
}
