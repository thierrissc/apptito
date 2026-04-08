CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  avatar_url TEXT,
  restaurante_nome TEXT,
  restaurante_logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
  preco_custo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  imagem_url TEXT,
  disponivel BOOLEAN DEFAULT TRUE,
  ativo BOOLEAN DEFAULT TRUE,
  destaque BOOLEAN DEFAULT FALSE,
  tempo_preparo INTEGER DEFAULT 0,
  unidade TEXT DEFAULT 'un',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL,
  quantidade_minima DECIMAL(10, 2) NOT NULL DEFAULT 0,
  custo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ultima_compra TIMESTAMP WITH TIME ZONE,
  proxima_validade TIMESTAMP WITH TIME ZONE,
  fornecedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque_movimentacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estoque_id UUID REFERENCES estoque(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  quantidade DECIMAL(10, 2) NOT NULL,
  custo_total DECIMAL(10, 2),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  data_nascimento DATE,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  cep TEXT,
  complemento TEXT,
  observacoes TEXT,
  total_compras DECIMAL(12, 2) DEFAULT 0,
  quantidade_compras INTEGER DEFAULT 0,
  ultima_compra TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  cargo TEXT NOT NULL,
  salario DECIMAL(10, 2) NOT NULL DEFAULT 0,
  data_admissao DATE,
  data_demissao DATE,
  ativo BOOLEAN DEFAULT TRUE,
  pix TEXT,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  capacidade INTEGER NOT NULL DEFAULT 2,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'ocupada', 'reservada', 'manutencao')),
  localizacao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comandas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  mesa TEXT,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  subtotal DECIMAL(12, 2) DEFAULT 0,
  desconto DECIMAL(12, 2) DEFAULT 0,
  taxa_servico DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fechada_em TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS comanda_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  nome_produto TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparando', 'pronto', 'entregue', 'cancelado')),
  estoque_abatido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produto_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  estoque_id UUID NOT NULL REFERENCES estoque(id) ON DELETE CASCADE,
  quantidade DECIMAL(10, 2) NOT NULL,
  unidade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT,
  endereco TEXT NOT NULL,
  bairro TEXT,
  complemento TEXT,
  referencia TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'preparando', 'saiu_entrega', 'entregue', 'cancelado')),
  subtotal DECIMAL(12, 2) DEFAULT 0,
  taxa_entrega DECIMAL(12, 2) DEFAULT 0,
  desconto DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) DEFAULT 0,
  forma_pagamento TEXT,
  troco_para DECIMAL(12, 2),
  observacoes TEXT,
  entregador_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  tempo_estimado INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entregue_em TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS delivery_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES delivery_pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  nome_produto TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fechamento TIMESTAMP WITH TIME ZONE,
  valor_inicial DECIMAL(12, 2) NOT NULL DEFAULT 0,
  valor_final DECIMAL(12, 2),
  total_entradas DECIMAL(12, 2) DEFAULT 0,
  total_saidas DECIMAL(12, 2) DEFAULT 0,
  total_sangrias DECIMAL(12, 2) DEFAULT 0,
  total_suprimentos DECIMAL(12, 2) DEFAULT 0,
  diferenca DECIMAL(12, 2),
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS caixa_movimentacao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caixa_id UUID NOT NULL REFERENCES caixa(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('sangria', 'suprimento')),
  valor DECIMAL(12, 2) NOT NULL,
  justificativa TEXT,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  forma_pagamento TEXT,
  comanda_id UUID REFERENCES comandas(id) ON DELETE SET NULL,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  grupo_dre TEXT CHECK (grupo_dre IN ('receita_bruta', 'deducoes', 'cmv', 'despesas_fixas', 'despesas_financeiras')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cnpj TEXT,
  endereco TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  data_compra DATE NOT NULL,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compra_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  estoque_id UUID NOT NULL REFERENCES estoque(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
  quantidade DECIMAL(10, 2) NOT NULL,
  unidade TEXT NOT NULL,
  custo_unitario DECIMAL(10, 2) NOT NULL,
  custo_total DECIMAL(12, 2) NOT NULL,
  validade DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_contas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  pode_ver_dashboard BOOLEAN DEFAULT FALSE,
  pode_ver_vendas BOOLEAN DEFAULT FALSE,
  pode_ver_comandas BOOLEAN DEFAULT FALSE,
  pode_ver_cozinha BOOLEAN DEFAULT FALSE,
  pode_ver_delivery BOOLEAN DEFAULT FALSE,
  pode_ver_produtos BOOLEAN DEFAULT FALSE,
  pode_ver_estoque BOOLEAN DEFAULT FALSE,
  pode_ver_clientes BOOLEAN DEFAULT FALSE,
  pode_ver_equipe BOOLEAN DEFAULT FALSE,
  pode_ver_fornecedores BOOLEAN DEFAULT FALSE,
  pode_ver_financeiro BOOLEAN DEFAULT FALSE,
  pode_ver_configuracoes BOOLEAN DEFAULT FALSE,
  pode_editar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_categorias_user_id ON categorias(user_id);
CREATE INDEX idx_produtos_user_id ON produtos(user_id);
CREATE INDEX idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX idx_estoque_user_id ON estoque(user_id);
CREATE INDEX idx_estoque_movimentacao_user_id ON estoque_movimentacao(user_id);
CREATE INDEX idx_estoque_movimentacao_estoque_id ON estoque_movimentacao(estoque_id);
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX idx_mesas_user_id ON mesas(user_id);
CREATE INDEX idx_comandas_user_id ON comandas(user_id);
CREATE INDEX idx_comandas_numero ON comandas(numero);
CREATE INDEX idx_comandas_status ON comandas(status);
CREATE INDEX idx_comanda_itens_comanda_id ON comanda_itens(comanda_id);
CREATE INDEX idx_comanda_itens_status ON comanda_itens(status);
CREATE INDEX idx_produto_ingredientes_produto_id ON produto_ingredientes(produto_id);
CREATE INDEX idx_produto_ingredientes_estoque_id ON produto_ingredientes(estoque_id);
CREATE INDEX idx_delivery_pedidos_user_id ON delivery_pedidos(user_id);
CREATE INDEX idx_delivery_pedidos_numero ON delivery_pedidos(numero);
CREATE INDEX idx_delivery_pedidos_status ON delivery_pedidos(status);
CREATE INDEX idx_delivery_itens_pedido_id ON delivery_itens(pedido_id);
CREATE INDEX idx_caixa_user_id ON caixa(user_id);
CREATE INDEX idx_caixa_status ON caixa(status);
CREATE INDEX idx_caixa_movimentacao_caixa_id ON caixa_movimentacao(caixa_id);
CREATE INDEX idx_transacoes_user_id ON transacoes(user_id);
CREATE INDEX idx_transacoes_data ON transacoes(data);
CREATE INDEX idx_categorias_financeiras_user_id ON categorias_financeiras(user_id);
CREATE INDEX idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX idx_compras_user_id ON compras(user_id);
CREATE INDEX idx_compra_itens_compra_id ON compra_itens(compra_id);
CREATE INDEX idx_sub_contas_user_id ON sub_contas(user_id);
CREATE INDEX idx_sub_contas_email ON sub_contas(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_movimentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compra_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own data"
  ON categorias FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own data"
  ON categorias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data"
  ON categorias FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data"
  ON categorias FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their products"
  ON produtos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their products"
  ON produtos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their products"
  ON produtos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their products"
  ON produtos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their estoque"
  ON estoque FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their estoque"
  ON estoque FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their estoque"
  ON estoque FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their estoque"
  ON estoque FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their estoque_movimentacao"
  ON estoque_movimentacao FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their estoque_movimentacao"
  ON estoque_movimentacao FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their clientes"
  ON clientes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their clientes"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their clientes"
  ON clientes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their clientes"
  ON clientes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their funcionarios"
  ON funcionarios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their funcionarios"
  ON funcionarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their funcionarios"
  ON funcionarios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their funcionarios"
  ON funcionarios FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their mesas"
  ON mesas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their mesas"
  ON mesas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their mesas"
  ON mesas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their mesas"
  ON mesas FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their comandas"
  ON comandas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their comandas"
  ON comandas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their comandas"
  ON comandas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comandas"
  ON comandas FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their comanda_itens"
  ON comanda_itens FOR SELECT
  USING (EXISTS (SELECT 1 FROM comandas WHERE comandas.id = comanda_itens.comanda_id AND auth.uid() = comandas.user_id));

CREATE POLICY "Users can manage their comanda_itens"
  ON comanda_itens FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM comandas WHERE comandas.id = comanda_itens.comanda_id AND auth.uid() = comandas.user_id));

CREATE POLICY "Users can view their produto_ingredientes"
  ON produto_ingredientes FOR SELECT
  USING (EXISTS (SELECT 1 FROM produtos WHERE produtos.id = produto_ingredientes.produto_id AND auth.uid() = produtos.user_id));

CREATE POLICY "Users can manage their produto_ingredientes"
  ON produto_ingredientes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM produtos WHERE produtos.id = produto_ingredientes.produto_id AND auth.uid() = produtos.user_id));

CREATE POLICY "Users can view their delivery_pedidos"
  ON delivery_pedidos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their delivery_pedidos"
  ON delivery_pedidos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their delivery_pedidos"
  ON delivery_pedidos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their delivery_itens"
  ON delivery_itens FOR SELECT
  USING (EXISTS (SELECT 1 FROM delivery_pedidos WHERE delivery_pedidos.id = delivery_itens.pedido_id AND auth.uid() = delivery_pedidos.user_id));

CREATE POLICY "Users can manage their delivery_itens"
  ON delivery_itens FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM delivery_pedidos WHERE delivery_pedidos.id = delivery_itens.pedido_id AND auth.uid() = delivery_pedidos.user_id));

CREATE POLICY "Users can view their caixa"
  ON caixa FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their caixa"
  ON caixa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their caixa"
  ON caixa FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their caixa_movimentacao"
  ON caixa_movimentacao FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their caixa_movimentacao"
  ON caixa_movimentacao FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their transacoes"
  ON transacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their transacoes"
  ON transacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their transacoes"
  ON transacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their transacoes"
  ON transacoes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their categorias_financeiras"
  ON categorias_financeiras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their categorias_financeiras"
  ON categorias_financeiras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their categorias_financeiras"
  ON categorias_financeiras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their fornecedores"
  ON fornecedores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their fornecedores"
  ON fornecedores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their fornecedores"
  ON fornecedores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their fornecedores"
  ON fornecedores FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their compras"
  ON compras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their compras"
  ON compras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their compras"
  ON compras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their compra_itens"
  ON compra_itens FOR SELECT
  USING (EXISTS (SELECT 1 FROM compras WHERE compras.id = compra_itens.compra_id AND auth.uid() = compras.user_id));

CREATE POLICY "Users can manage their compra_itens"
  ON compra_itens FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM compras WHERE compras.id = compra_itens.compra_id AND auth.uid() = compras.user_id));

CREATE POLICY "Users can view their sub_contas"
  ON sub_contas FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = owner_id);

CREATE POLICY "Users can manage their sub_contas"
  ON sub_contas FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their sub_contas"
  ON sub_contas FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their sub_contas"
  ON sub_contas FOR DELETE
  USING (auth.uid() = owner_id);
