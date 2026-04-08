import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { FinanceiroStats } from '@/components/financeiro/financeiro-stats'
import { FinanceiroIndicadores } from '@/components/financeiro/financeiro-indicadores'
import { TransacoesWrapper } from '@/components/financeiro/transacoes-wrapper'
import { DRESimplificado } from '@/components/financeiro/dre-simplificado'
import { NovaTransacaoButton } from '@/components/financeiro/nova-transacao-button'
import { CategoriasFinanceirasButton } from '@/components/financeiro/categorias-financeiras-button'
import { FiltroFinanceiro } from '@/components/financeiro/filtro-financeiro'
import { CalendarioFinanceiro } from '@/components/financeiro/calendario-financeiro'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

interface PageProps {
  searchParams: Promise<{
    tipo?: string
    forma_pagamento?: string
    data_inicio?: string
    data_fim?: string
  }>
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId

  const profile = await getProfileForDisplay()

  const hoje = new Date()
  const dataInicio = params.data_inicio || new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const dataFim = params.data_fim || hoje.toISOString().split('T')[0]

  let transacoesQuery = supabase
    .from('transacoes')
    .select('*')
    .eq('user_id', uid)
    .gte('data', dataInicio)
    .lte('data', dataFim)
    .order('created_at', { ascending: false })

  if (params.tipo && params.tipo !== 'todos') {
    transacoesQuery = transacoesQuery.eq('tipo', params.tipo)
  }
  if (params.forma_pagamento && params.forma_pagamento !== 'todos') {
    transacoesQuery = transacoesQuery.eq('forma_pagamento', params.forma_pagamento)
  }

  const [{ data: transacoes }, { data: todasTransacoes }, { data: estoque }] = await Promise.all([
    transacoesQuery,
    supabase.from('transacoes').select('*').eq('user_id', uid).gte('data', dataInicio).lte('data', dataFim),
    supabase.from('estoque').select('quantidade, custo_unitario').eq('user_id', uid),
  ])

  const entradas = todasTransacoes?.filter(t => t.tipo === 'entrada') || []
  const saidas = todasTransacoes?.filter(t => t.tipo === 'saida') || []

  const totalEntradas = entradas.reduce((acc, t) => acc + Number(t.valor), 0)
  const totalSaidas = saidas.reduce((acc, t) => acc + Number(t.valor), 0)
  const faturamento = totalEntradas

  const valorEstoque = estoque?.reduce((acc, item) =>
    acc + (Number(item.quantidade) * Number(item.custo_unitario)), 0) || 0

  const cmv = saidas.filter(s =>
    s.categoria === 'Compras' ||
    s.categoria === 'Insumos' ||
    s.categoria === 'CMV'
  ).reduce((acc, t) => acc + Number(t.valor), 0)

  const deducoes = saidas.filter(s =>
    s.categoria === 'Impostos' ||
    s.categoria === 'Taxas de Apps' ||
    s.categoria === 'Estornos' ||
    s.categoria === 'Cancelamentos'
  ).reduce((acc, t) => acc + Number(t.valor), 0)

  const despFixas = saidas.filter(s =>
    s.categoria === 'Água' ||
    s.categoria === 'Luz' ||
    s.categoria === 'Aluguel' ||
    s.categoria === 'Salários' ||
    s.categoria === 'Despesas Fixas' ||
    s.categoria === 'Operacional'
  ).reduce((acc, t) => acc + Number(t.valor), 0)

  const despFinanceiras = saidas.filter(s =>
    s.categoria === 'Juros' ||
    s.categoria === 'Taxas Bancárias' ||
    s.categoria === 'Despesas Financeiras'
  ).reduce((acc, t) => acc + Number(t.valor), 0)

  const receitaLiquida = faturamento - deducoes
  const lucroBruto = receitaLiquida - cmv
  const resultadoOperacional = lucroBruto - despFixas
  const lucroLiquido = resultadoOperacional - despFinanceiras

  const cmvPercent = faturamento > 0 ? ((cmv / faturamento) * 100).toFixed(0) : '0'
  const despFixasPercent = faturamento > 0 ? ((despFixas / faturamento) * 100).toFixed(0) : '0'
  const impostosPercent = faturamento > 0 ? ((deducoes / faturamento) * 100).toFixed(0) : '0'
  const lucroPercent = faturamento > 0 ? ((lucroLiquido / faturamento) * 100).toFixed(0) : '0'

  const getCmvStatus = (percent: number) => {
    if (percent <= 30) return { status: 'Excelente', description: 'Abaixo do ideal (30-35%)' }
    if (percent <= 35) return { status: 'Saudável', description: 'Dentro do ideal (30-35%)' }
    if (percent <= 45) return { status: 'Atenção', description: 'Acima do ideal (30-35%)' }
    return { status: 'Crítico', description: 'Muito acima do ideal (30-35%)' }
  }

  const getDespStatus = (percent: number) => percent <= 25 ? 'Saudável' : percent <= 35 ? 'Atenção' : 'Crítico'
  const getImpostosStatus = (percent: number) => percent <= 30 ? 'Normal' : 'Acima do Normal'
  const getLucroStatus = (percent: number) => percent >= 15 ? 'Saudável' : percent >= 8 ? 'Atenção' : 'Crítico'

  const cmvStatusInfo = getCmvStatus(Number(cmvPercent))

  return (
    <div className="space-y-6">
      <Header title="Financeiro" profile={profile}>
        <FiltroFinanceiro />
        <CalendarioFinanceiro />
        <CategoriasFinanceirasButton />
        <NovaTransacaoButton />
      </Header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FinanceiroStats
            faturamento={faturamento}
            entradas={totalEntradas}
            saidas={totalSaidas}
            estoque={valorEstoque}
          />

          <FinanceiroIndicadores
            cmv={cmv}
            cmvPercent={cmvPercent}
            cmvStatus={cmvStatusInfo.status}
            cmvDescription={cmvStatusInfo.description}
            despOperacionais={despFixas}
            despOperPercent={despFixasPercent}
            despStatus={getDespStatus(Number(despFixasPercent))}
            impostos={deducoes}
            impostosPercent={impostosPercent}
            impostosStatus={getImpostosStatus(Number(impostosPercent))}
            lucroLiquido={lucroLiquido}
            lucroPercent={lucroPercent}
            lucroStatus={getLucroStatus(Number(lucroPercent))}
          />

          <TransacoesWrapper transacoes={transacoes || []} />
        </div>

        <div>
          <DRESimplificado
            receitaBruta={faturamento}
            deducoes={deducoes}
            cmv={cmv}
            despFixas={despFixas}
            despFinanceiras={despFinanceiras}
            lucroLiquido={lucroLiquido}
          />
        </div>
      </div>
    </div>
  )
}
