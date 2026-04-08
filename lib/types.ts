export interface Profile {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cargo: string | null
  avatar_url: string | null
  restaurante_nome: string | null
  restaurante_logo: string | null
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: string
  user_id: string
  nome: string
  descricao: string | null
  ordem: number
  ativo: boolean
  created_at: string
}

export interface Produto {
  id: string
  user_id: string
  categoria_id: string | null
  nome: string
  descricao: string | null
  preco: number
  preco_custo: number
  imagem_url: string | null
  disponivel: boolean
  ativo: boolean
  destaque: boolean
  tempo_preparo: number
  unidade: string
  created_at: string
  updated_at: string
  categoria?: Categoria
}

export interface Estoque {
  id: string
  user_id: string
  nome: string
  quantidade: number
  unidade: string
  quantidade_minima: number
  custo_unitario: number
  ultima_compra: string | null
  proxima_validade: string | null
  fornecedor: string | null
  created_at: string
  updated_at: string
}

export interface EstoqueMovimentacao {
  id: string
  user_id: string
  estoque_id: string | null
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  custo_total: number | null
  observacao: string | null
  created_at: string
  estoque?: Estoque
}

export interface Cliente {
  id: string
  user_id: string
  nome: string
  telefone: string | null
  email: string | null
  cpf: string | null
  data_nascimento: string | null
  endereco: string | null
  bairro: string | null
  cidade: string | null
  cep: string | null
  complemento: string | null
  observacoes: string | null
  total_compras: number
  quantidade_compras: number
  ultima_compra: string | null
  created_at: string
  updated_at: string
}

export interface Funcionario {
  id: string
  user_id: string
  nome: string
  telefone: string | null
  email: string | null
  cpf: string | null
  cargo: string
  salario: number
  data_admissao: string | null
  data_demissao: string | null
  ativo: boolean
  pix: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Comanda {
  id: string
  user_id: string
  numero: number
  cliente_id: string | null
  funcionario_id: string | null
  mesa: string | null
  status: 'aberta' | 'fechada' | 'cancelada'
  subtotal: number
  desconto: number
  taxa_servico: number
  total: number
  forma_pagamento: string | null
  observacoes: string | null
  created_at: string
  fechada_em: string | null
  cliente?: Cliente
  funcionario?: Funcionario
  itens?: ComandaItem[]
}

export interface ComandaItem {
  id: string
  comanda_id: string
  produto_id: string | null
  nome_produto: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  observacoes: string | null
  status: 'pendente' | 'preparando' | 'pronto' | 'entregue' | 'cancelado'
  estoque_abatido: boolean
  created_at: string
  produto?: Produto
}

export interface ProdutoIngrediente {
  id: string
  produto_id: string
  estoque_id: string
  quantidade: number
  unidade: string
  created_at: string
  estoque?: Estoque
}

export interface Transacao {
  id: string
  user_id: string
  tipo: 'entrada' | 'saida'
  categoria: string
  descricao: string
  valor: number
  data: string
  hora: string
  forma_pagamento: string | null
  comanda_id: string | null
  funcionario_id: string | null
  comprovante_url: string | null
  observacoes: string | null
  created_at: string
}

export interface Delivery {
  id: string
  user_id: string
  numero: number
  cliente_id: string | null
  cliente_nome: string
  cliente_telefone: string | null
  endereco: string
  bairro: string | null
  complemento: string | null
  referencia: string | null
  status: 'pendente' | 'confirmado' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelado'
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  forma_pagamento: string | null
  troco_para: number | null
  observacoes: string | null
  entregador_id: string | null
  tempo_estimado: number
  created_at: string
  entregue_em: string | null
  cliente?: Cliente
  entregador?: Funcionario
  itens?: DeliveryItem[]
}

export interface DeliveryPedido {
  id: string
  user_id: string
  numero: number
  cliente_id: string | null
  cliente_nome: string
  cliente_telefone: string | null
  endereco: string
  bairro: string | null
  complemento: string | null
  referencia: string | null
  status: 'pendente' | 'confirmado' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelado'
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  forma_pagamento: string | null
  troco_para: number | null
  observacoes: string | null
  entregador_id: string | null
  tempo_estimado: number
  created_at: string
  entregue_em: string | null
  cliente?: Cliente
  entregador?: Funcionario
  itens?: DeliveryItem[]
}

export interface DeliveryItem {
  id: string
  pedido_id: string
  produto_id: string | null
  nome_produto: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  observacoes: string | null
  created_at: string
  produto?: Produto
}

export interface Caixa {
  id: string
  user_id: string
  funcionario_id: string | null
  data_abertura: string
  data_fechamento: string | null
  valor_inicial: number
  valor_final: number | null
  total_entradas: number
  total_saidas: number
  total_sangrias: number
  total_suprimentos: number
  diferenca: number | null
  status: 'aberto' | 'fechado'
  observacoes: string | null
  created_at: string
  funcionario?: Funcionario
}

export interface CaixaMovimentacao {
  id: string
  user_id: string
  caixa_id: string
  tipo: 'sangria' | 'suprimento'
  valor: number
  justificativa: string
  funcionario_id: string | null
  created_at: string
  funcionario?: Funcionario
}

export interface SubConta {
  id: string
  user_id: string
  owner_id: string
  funcionario_id: string | null
  email: string
  nome: string
  ativo: boolean
  pode_ver_dashboard: boolean
  pode_ver_vendas: boolean
  pode_ver_comandas: boolean
  pode_ver_cozinha: boolean
  pode_ver_delivery: boolean
  pode_ver_produtos: boolean
  pode_ver_estoque: boolean
  pode_ver_clientes: boolean
  pode_ver_equipe: boolean
  pode_ver_fornecedores: boolean
  pode_ver_financeiro: boolean
  pode_ver_configuracoes: boolean
  pode_editar: boolean
  created_at: string
  updated_at: string
  funcionario?: Funcionario
}

export interface DashboardStats {
  faturamento: number
  vendas: number
  lucroLiquido: number
  ticketMedio: number
}

export interface CategoriaFinanceira {
  id: string
  user_id: string
  nome: string
  tipo: 'entrada' | 'saida'
  grupo_dre: 'receita_bruta' | 'deducoes' | 'cmv' | 'despesas_fixas' | 'despesas_financeiras'
  ativo: boolean
  created_at: string
}

export interface Fornecedor {
  id: string
  user_id: string
  nome: string
  telefone: string | null
  email: string | null
  cnpj: string | null
  endereco: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Compra {
  id: string
  user_id: string
  fornecedor_id: string | null
  data_compra: string
  total: number
  observacoes: string | null
  created_at: string
  fornecedor?: Fornecedor
  itens?: CompraItem[]
}

export interface CompraItem {
  id: string
  compra_id: string
  estoque_id: string
  categoria_id: string | null
  quantidade: number
  unidade: string
  custo_unitario: number
  custo_total: number
  validade: string | null
  created_at: string
  estoque?: Estoque
  categoria?: CategoriaFinanceira
}

export interface Mesa {
  id: string
  user_id: string
  numero: number
  capacidade: number
  status: 'disponivel' | 'ocupada' | 'reservada' | 'manutencao'
  localizacao: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  comandas?: Comanda[]
}
