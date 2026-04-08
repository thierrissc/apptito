const CONVERSAO_PESO: Record<string, number> = {
  'g': 1,
  'kg': 1000,
  'mg': 0.001,
}

const CONVERSAO_VOLUME: Record<string, number> = {
  'ml': 1,
  'l': 1000,
  'cl': 10,
}

const CONVERSAO_UNIDADE: Record<string, number> = {
  'un': 1,
  'dz': 12,
  'cx': 1, 
  'pct': 1, 
}

export function getTipoUnidade(unidade: string): 'peso' | 'volume' | 'unidade' {
  const u = unidade.toLowerCase()
  if (CONVERSAO_PESO[u]) return 'peso'
  if (CONVERSAO_VOLUME[u]) return 'volume'
  return 'unidade'
}

export function converterParaBase(quantidade: number, unidade: string): number {
  const u = unidade.toLowerCase()
  
  if (CONVERSAO_PESO[u]) {
    return quantidade * CONVERSAO_PESO[u]
  }
  if (CONVERSAO_VOLUME[u]) {
    return quantidade * CONVERSAO_VOLUME[u]
  }
  if (CONVERSAO_UNIDADE[u]) {
    return quantidade * CONVERSAO_UNIDADE[u]
  }
  
  return quantidade
}

export function converterDeBase(quantidadeBase: number, unidadeAlvo: string): number {
  const u = unidadeAlvo.toLowerCase()
  
  if (CONVERSAO_PESO[u]) {
    return quantidadeBase / CONVERSAO_PESO[u]
  }
  if (CONVERSAO_VOLUME[u]) {
    return quantidadeBase / CONVERSAO_VOLUME[u]
  }
  if (CONVERSAO_UNIDADE[u]) {
    return quantidadeBase / CONVERSAO_UNIDADE[u]
  }
  
  return quantidadeBase
}

export function converterUnidade(
  quantidade: number,
  unidadeOrigem: string,
  unidadeDestino: string
): number {
  const tipoOrigem = getTipoUnidade(unidadeOrigem)
  const tipoDestino = getTipoUnidade(unidadeDestino)
  
  if (tipoOrigem !== tipoDestino) {
    console.warn(`Nao e possivel converter ${unidadeOrigem} para ${unidadeDestino}`)
    return quantidade
  }
  
  const quantidadeBase = converterParaBase(quantidade, unidadeOrigem)
  return converterDeBase(quantidadeBase, unidadeDestino)
}

export interface IngredienteNecessario {
  estoqueId: string
  estoqueNome: string
  quantidadeNecessaria: number
  unidadeNecessaria: string
  quantidadeDisponivel: number
  unidadeDisponivel: string
  suficiente: boolean
  faltando: number
}

export function verificarEstoqueSuficiente(
  ingredientes: Array<{
    estoque_id: string
    quantidade: number
    unidade: string
    estoque?: {
      id: string
      nome: string
      quantidade: number
      unidade: string
    }
  }>,
  quantidadePratos: number = 1
): { suficiente: boolean; detalhes: IngredienteNecessario[] } {
  const detalhes: IngredienteNecessario[] = []
  let suficiente = true

  for (const ing of ingredientes) {
    if (!ing.estoque) continue

    const quantidadeNecessariaTotal = ing.quantidade * quantidadePratos
    
    const quantidadeNecessariaConvertida = converterUnidade(
      quantidadeNecessariaTotal,
      ing.unidade,
      ing.estoque.unidade
    )

    const temSuficiente = ing.estoque.quantidade >= quantidadeNecessariaConvertida
    if (!temSuficiente) suficiente = false

    detalhes.push({
      estoqueId: ing.estoque.id,
      estoqueNome: ing.estoque.nome,
      quantidadeNecessaria: quantidadeNecessariaTotal,
      unidadeNecessaria: ing.unidade,
      quantidadeDisponivel: ing.estoque.quantidade,
      unidadeDisponivel: ing.estoque.unidade,
      suficiente: temSuficiente,
      faltando: temSuficiente ? 0 : quantidadeNecessariaConvertida - ing.estoque.quantidade,
    })
  }

  return { suficiente, detalhes }
}

export function calcularAbatimento(
  quantidadeIngrediente: number,
  unidadeIngrediente: string,
  unidadeEstoque: string,
  quantidadePratos: number = 1
): number {
  const quantidadeTotal = quantidadeIngrediente * quantidadePratos
  return converterUnidade(quantidadeTotal, unidadeIngrediente, unidadeEstoque)
}

export function formatarQuantidadeEstoque(quantidade: number, unidade: string): string {
  const u = unidade.toLowerCase()
  
  if (u === 'g' && quantidade >= 1000) {
    return `${(quantidade / 1000).toFixed(2).replace('.', ',')}kg`
  }
  
  if (u === 'ml' && quantidade >= 1000) {
    return `${(quantidade / 1000).toFixed(2).replace('.', ',')}l`
  }
  
  if (Number.isInteger(quantidade)) {
    return `${quantidade}${u}`
  }
  
  return `${quantidade.toFixed(2).replace('.', ',')}${u}`
}
