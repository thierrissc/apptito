'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { converterUnidade } from '@/lib/estoque-utils'

export async function abaterEstoqueComanda(
  comandaItemId: string,
  quantidadePratos: number = 1
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: item, error: itemError } = await supabase
    .from('comanda_itens')
    .select('*, produto:produtos(*)')
    .eq('id', comandaItemId)
    .single()

  if (itemError || !item) {
    return { error: 'Item da comanda nao encontrado' }
  }

  if (item.estoque_abatido) {
    return { error: 'Estoque ja foi abatido para este item' }
  }

  if (!item.produto_id) {
    return { error: 'Produto nao vinculado ao item' }
  }

  const { data: ingredientes, error: ingError } = await supabase
    .from('produto_ingredientes')
    .select('*, estoque:estoque(*)')
    .eq('produto_id', item.produto_id)

  if (ingError) {
    return { error: 'Erro ao buscar ingredientes' }
  }

  if (!ingredientes || ingredientes.length === 0) {
    await supabase
      .from('comanda_itens')
      .update({ estoque_abatido: true })
      .eq('id', comandaItemId)
    
    return { success: true, message: 'Produto sem ingredientes cadastrados' }
  }

  for (const ing of ingredientes) {
    if (!ing.estoque) continue

    const quantidadeNecessaria = ing.quantidade * quantidadePratos
    const quantidadeConvertida = converterUnidade(
      quantidadeNecessaria,
      ing.unidade,
      ing.estoque.unidade
    )

    if (ing.estoque.quantidade < quantidadeConvertida) {
      return {
        error: `Estoque insuficiente de ${ing.estoque.nome}. Necessario: ${quantidadeNecessaria}${ing.unidade}, Disponivel: ${ing.estoque.quantidade}${ing.estoque.unidade}`
      }
    }
  }

  for (const ing of ingredientes) {
    if (!ing.estoque) continue

    const quantidadeNecessaria = ing.quantidade * quantidadePratos
    const quantidadeAbater = converterUnidade(
      quantidadeNecessaria,
      ing.unidade,
      ing.estoque.unidade
    )

    const novaQuantidade = ing.estoque.quantidade - quantidadeAbater

    const { error: updateError } = await supabase
      .from('estoque')
      .update({ 
        quantidade: novaQuantidade,
        updated_at: new Date().toISOString()
      })
      .eq('id', ing.estoque.id)

    if (updateError) {
      return { error: `Erro ao atualizar estoque de ${ing.estoque.nome}` }
    }

    await supabase
      .from('estoque_movimentacao')
      .insert({
        user_id: user.id,
        estoque_id: ing.estoque.id,
        tipo: 'saida',
        quantidade: quantidadeAbater,
        observacao: `Preparo: ${item.nome_produto} (Comanda)`,
      })
  }

  await supabase
    .from('comanda_itens')
    .update({ estoque_abatido: true })
    .eq('id', comandaItemId)

  revalidatePath('/dashboard/estoque')
  revalidatePath('/dashboard/comandas')

  return { success: true }
}

export async function excluirEstoque(estoqueId: string, motivo: string = 'Exclusao manual') {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: item, error: itemError } = await supabase
    .from('estoque')
    .select('*')
    .eq('id', estoqueId)
    .single()

  if (itemError || !item) {
    return { error: 'Item do estoque nao encontrado' }
  }

  const valorPerdido = item.quantidade * item.custo_unitario

  if (valorPerdido > 0) {
    await supabase
      .from('transacoes')
      .insert({
        user_id: user.id,
        tipo: 'saida',
        categoria: 'Perda de Estoque',
        descricao: `${motivo}: ${item.nome} (${item.quantidade}${item.unidade})`,
        valor: valorPerdido,
        data: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0],
        estoque_id: estoqueId,
      })
  }

  const { error: deleteError } = await supabase
    .from('estoque')
    .delete()
    .eq('id', estoqueId)

  if (deleteError) {
    return { error: 'Erro ao excluir item do estoque' }
  }

  revalidatePath('/dashboard/estoque')
  revalidatePath('/dashboard/financeiro')

  return { success: true, valorPerdido }
}

export async function fecharComanda(
  comandaId: string,
  formaPagamento: string,
  desconto: number = 0,
  taxaServico: number = 0
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: comanda, error: comandaError } = await supabase
    .from('comandas')
    .select('*, itens:comanda_itens(*), cliente:clientes(*)')
    .eq('id', comandaId)
    .single()

  if (comandaError || !comanda) {
    return { error: 'Comanda nao encontrada' }
  }

  if (comanda.status !== 'aberta') {
    return { error: 'Comanda ja foi fechada ou cancelada' }
  }

  const subtotal = comanda.itens?.reduce((acc: number, item: { subtotal: number }) => acc + item.subtotal, 0) || 0
  const total = subtotal - desconto + taxaServico

  const { error: updateError } = await supabase
    .from('comandas')
    .update({
      status: 'fechada',
      subtotal,
      desconto,
      taxa_servico: taxaServico,
      total,
      forma_pagamento: formaPagamento,
      fechada_em: new Date().toISOString(),
    })
    .eq('id', comandaId)

  if (updateError) {
    return { error: 'Erro ao fechar comanda' }
  }

  if (comanda.mesa) {
    const mesaNumero = parseInt(comanda.mesa, 10)
    if (!isNaN(mesaNumero)) {
      const { data: comandasAbertas } = await supabase
        .from('comandas')
        .select('id')
        .eq('user_id', comanda.user_id)
        .eq('mesa', comanda.mesa)
        .eq('status', 'aberta')
        .neq('id', comandaId)
      
      if (!comandasAbertas || comandasAbertas.length === 0) {
        await supabase
          .from('mesas')
          .update({ status: 'disponivel' })
          .eq('user_id', comanda.user_id)
          .eq('numero', mesaNumero)
      }
    }
  }

  await supabase
    .from('transacoes')
    .insert({
      user_id: user.id,
      tipo: 'entrada',
      categoria: 'Venda',
      descricao: `Comanda ${comanda.numero}${comanda.mesa ? ` - Mesa ${comanda.mesa}` : ''}`,
      valor: total,
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      forma_pagamento: formaPagamento,
      comanda_id: comandaId,
    })

  const { data: caixaAberto } = await supabase
    .from('caixa')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'aberto')
    .maybeSingle()

  if (caixaAberto) {
    await supabase
      .from('caixa')
      .update({
        total_entradas: (caixaAberto.total_entradas || 0) + total,
      })
      .eq('id', caixaAberto.id)
  }

  if (comanda.cliente_id) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('total_compras, quantidade_compras')
      .eq('id', comanda.cliente_id)
      .single()

    if (cliente) {
      await supabase
        .from('clientes')
        .update({
          total_compras: (cliente.total_compras || 0) + total,
          quantidade_compras: (cliente.quantidade_compras || 0) + 1,
          ultima_compra: new Date().toISOString(),
        })
        .eq('id', comanda.cliente_id)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/comandas')
  revalidatePath('/dashboard/financeiro')
  revalidatePath('/dashboard/vendas')

  return { success: true, total }
}

export async function cancelarComanda(comandaId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuario nao autenticado' }
  }

  const { data: comanda, error: comandaError } = await supabase
    .from('comandas')
    .select('*')
    .eq('id', comandaId)
    .single()

  if (comandaError || !comanda) {
    return { error: 'Comanda nao encontrada' }
  }

  if (comanda.status === 'cancelada') {
    return { error: 'Comanda ja foi cancelada' }
  }

  const { error: updateError } = await supabase
    .from('comandas')
    .update({ status: 'cancelada' })
    .eq('id', comandaId)

  if (updateError) {
    return { error: 'Erro ao cancelar comanda' }
  }

  if (comanda.mesa) {
    const mesaNumero = parseInt(comanda.mesa, 10)
    if (!isNaN(mesaNumero)) {
      const { data: comandasAbertas } = await supabase
        .from('comandas')
        .select('id')
        .eq('user_id', comanda.user_id)
        .eq('mesa', comanda.mesa)
        .eq('status', 'aberta')
        .neq('id', comandaId)
      
      if (!comandasAbertas || comandasAbertas.length === 0) {
        await supabase
          .from('mesas')
          .update({ status: 'disponivel' })
          .eq('user_id', comanda.user_id)
          .eq('numero', mesaNumero)
      }
    }
  }

  revalidatePath('/dashboard/comandas')

  return { success: true }
}

export async function verificarEstoqueProduto(
  produtoId: string,
  quantidade: number = 1
) {
  const supabase = await createClient()

  const { data: ingredientes, error } = await supabase
    .from('produto_ingredientes')
    .select('*, estoque:estoque(*)')
    .eq('produto_id', produtoId)

  if (error) {
    return { error: 'Erro ao verificar estoque' }
  }

  if (!ingredientes || ingredientes.length === 0) {
    return { disponivel: true, semIngredientes: true }
  }

  const faltando: Array<{ nome: string; necessario: string; disponivel: string }> = []

  for (const ing of ingredientes) {
    if (!ing.estoque) continue

    const quantidadeNecessaria = ing.quantidade * quantidade
    const quantidadeConvertida = converterUnidade(
      quantidadeNecessaria,
      ing.unidade,
      ing.estoque.unidade
    )

    if (ing.estoque.quantidade < quantidadeConvertida) {
      faltando.push({
        nome: ing.estoque.nome,
        necessario: `${quantidadeNecessaria}${ing.unidade}`,
        disponivel: `${ing.estoque.quantidade}${ing.estoque.unidade}`,
      })
    }
  }

  if (faltando.length > 0) {
    return {
      disponivel: false,
      faltando,
      mensagem: `Estoque insuficiente: ${faltando.map(f => f.nome).join(', ')}`,
    }
  }

  return { disponivel: true }
}
