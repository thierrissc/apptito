
CREATE OR REPLACE FUNCTION public.get_effective_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.sub_contas WHERE user_id = auth.uid() AND ativo = true LIMIT 1),
    auth.uid()
  );
$$;

DROP POLICY IF EXISTS "produtos_select_effective" ON public.produtos;
DROP POLICY IF EXISTS "produtos_insert_effective" ON public.produtos;
DROP POLICY IF EXISTS "produtos_update_effective" ON public.produtos;
DROP POLICY IF EXISTS "produtos_delete_effective" ON public.produtos;

CREATE POLICY "produtos_select_effective" ON public.produtos FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "produtos_insert_effective" ON public.produtos FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "produtos_update_effective" ON public.produtos FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "produtos_delete_effective" ON public.produtos FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "categorias_select_effective" ON public.categorias;
DROP POLICY IF EXISTS "categorias_insert_effective" ON public.categorias;
DROP POLICY IF EXISTS "categorias_update_effective" ON public.categorias;
DROP POLICY IF EXISTS "categorias_delete_effective" ON public.categorias;

CREATE POLICY "categorias_select_effective" ON public.categorias FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "categorias_insert_effective" ON public.categorias FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "categorias_update_effective" ON public.categorias FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "categorias_delete_effective" ON public.categorias FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "categorias_financeiras_select_effective" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "categorias_financeiras_insert_effective" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "categorias_financeiras_update_effective" ON public.categorias_financeiras;
DROP POLICY IF EXISTS "categorias_financeiras_delete_effective" ON public.categorias_financeiras;

CREATE POLICY "categorias_financeiras_select_effective" ON public.categorias_financeiras FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "categorias_financeiras_insert_effective" ON public.categorias_financeiras FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "categorias_financeiras_update_effective" ON public.categorias_financeiras FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "categorias_financeiras_delete_effective" ON public.categorias_financeiras FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "clientes_select_effective" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_effective" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_effective" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_effective" ON public.clientes;

CREATE POLICY "clientes_select_effective" ON public.clientes FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "clientes_insert_effective" ON public.clientes FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "clientes_update_effective" ON public.clientes FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "clientes_delete_effective" ON public.clientes FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "comandas_select_effective" ON public.comandas;
DROP POLICY IF EXISTS "comandas_insert_effective" ON public.comandas;
DROP POLICY IF EXISTS "comandas_update_effective" ON public.comandas;
DROP POLICY IF EXISTS "comandas_delete_effective" ON public.comandas;

CREATE POLICY "comandas_select_effective" ON public.comandas FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "comandas_insert_effective" ON public.comandas FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "comandas_update_effective" ON public.comandas FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "comandas_delete_effective" ON public.comandas FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "comanda_itens_select_effective" ON public.comanda_itens;
DROP POLICY IF EXISTS "comanda_itens_insert_effective" ON public.comanda_itens;
DROP POLICY IF EXISTS "comanda_itens_update_effective" ON public.comanda_itens;

CREATE POLICY "comanda_itens_select_effective" ON public.comanda_itens
  FOR SELECT USING (comanda_id IN (SELECT id FROM public.comandas WHERE user_id = public.get_effective_owner_id()));

CREATE POLICY "comanda_itens_insert_effective" ON public.comanda_itens
  FOR INSERT WITH CHECK (comanda_id IN (SELECT id FROM public.comandas WHERE user_id = public.get_effective_owner_id()));

CREATE POLICY "comanda_itens_update_effective" ON public.comanda_itens
  FOR UPDATE USING (comanda_id IN (SELECT id FROM public.comandas WHERE user_id = public.get_effective_owner_id()));

DROP POLICY IF EXISTS "caixa_select_effective" ON public.caixa;
DROP POLICY IF EXISTS "caixa_insert_effective" ON public.caixa;
DROP POLICY IF EXISTS "caixa_update_effective" ON public.caixa;
DROP POLICY IF EXISTS "caixa_delete_effective" ON public.caixa;

CREATE POLICY "caixa_select_effective" ON public.caixa FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "caixa_insert_effective" ON public.caixa FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "caixa_update_effective" ON public.caixa FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "caixa_delete_effective" ON public.caixa FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "caixa_movimentacao_select_effective" ON public.caixa_movimentacao;
DROP POLICY IF EXISTS "caixa_movimentacao_insert_effective" ON public.caixa_movimentacao;
DROP POLICY IF EXISTS "caixa_movimentacao_update_effective" ON public.caixa_movimentacao;

CREATE POLICY "caixa_movimentacao_select_effective" ON public.caixa_movimentacao FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "caixa_movimentacao_insert_effective" ON public.caixa_movimentacao FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "caixa_movimentacao_update_effective" ON public.caixa_movimentacao FOR UPDATE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "compras_select_effective" ON public.compras;
DROP POLICY IF EXISTS "compras_insert_effective" ON public.compras;
DROP POLICY IF EXISTS "compras_update_effective" ON public.compras;
DROP POLICY IF EXISTS "compras_delete_effective" ON public.compras;

CREATE POLICY "compras_select_effective" ON public.compras FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "compras_insert_effective" ON public.compras FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "compras_update_effective" ON public.compras FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "compras_delete_effective" ON public.compras FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "compra_itens_select_effective" ON public.compra_itens;
DROP POLICY IF EXISTS "compra_itens_insert_effective" ON public.compra_itens;

CREATE POLICY "compra_itens_select_effective" ON public.compra_itens
  FOR SELECT USING (compra_id IN (SELECT id FROM public.compras WHERE user_id = public.get_effective_owner_id()));

CREATE POLICY "compra_itens_insert_effective" ON public.compra_itens
  FOR INSERT WITH CHECK (compra_id IN (SELECT id FROM public.compras WHERE user_id = public.get_effective_owner_id()));

DROP POLICY IF EXISTS "delivery_pedidos_select_effective" ON public.delivery_pedidos;
DROP POLICY IF EXISTS "delivery_pedidos_insert_effective" ON public.delivery_pedidos;
DROP POLICY IF EXISTS "delivery_pedidos_update_effective" ON public.delivery_pedidos;
DROP POLICY IF EXISTS "delivery_pedidos_delete_effective" ON public.delivery_pedidos;

CREATE POLICY "delivery_pedidos_select_effective" ON public.delivery_pedidos FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "delivery_pedidos_insert_effective" ON public.delivery_pedidos FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "delivery_pedidos_update_effective" ON public.delivery_pedidos FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "delivery_pedidos_delete_effective" ON public.delivery_pedidos FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "delivery_itens_select_effective" ON public.delivery_itens;
DROP POLICY IF EXISTS "delivery_itens_insert_effective" ON public.delivery_itens;

CREATE POLICY "delivery_itens_select_effective" ON public.delivery_itens
  FOR SELECT USING (pedido_id IN (SELECT id FROM public.delivery_pedidos WHERE user_id = public.get_effective_owner_id()));

CREATE POLICY "delivery_itens_insert_effective" ON public.delivery_itens
  FOR INSERT WITH CHECK (pedido_id IN (SELECT id FROM public.delivery_pedidos WHERE user_id = public.get_effective_owner_id()));

DROP POLICY IF EXISTS "estoque_select_effective" ON public.estoque;
DROP POLICY IF EXISTS "estoque_insert_effective" ON public.estoque;
DROP POLICY IF EXISTS "estoque_update_effective" ON public.estoque;
DROP POLICY IF EXISTS "estoque_delete_effective" ON public.estoque;

CREATE POLICY "estoque_select_effective" ON public.estoque FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "estoque_insert_effective" ON public.estoque FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "estoque_update_effective" ON public.estoque FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "estoque_delete_effective" ON public.estoque FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "estoque_movimentacao_select_effective" ON public.estoque_movimentacao;
DROP POLICY IF EXISTS "estoque_movimentacao_insert_effective" ON public.estoque_movimentacao;
DROP POLICY IF EXISTS "estoque_movimentacao_update_effective" ON public.estoque_movimentacao;

CREATE POLICY "estoque_movimentacao_select_effective" ON public.estoque_movimentacao FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "estoque_movimentacao_insert_effective" ON public.estoque_movimentacao FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "estoque_movimentacao_update_effective" ON public.estoque_movimentacao FOR UPDATE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "fornecedores_select_effective" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_insert_effective" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_update_effective" ON public.fornecedores;
DROP POLICY IF EXISTS "fornecedores_delete_effective" ON public.fornecedores;

CREATE POLICY "fornecedores_select_effective" ON public.fornecedores FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "fornecedores_insert_effective" ON public.fornecedores FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "fornecedores_update_effective" ON public.fornecedores FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "fornecedores_delete_effective" ON public.fornecedores FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "funcionarios_select_effective" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert_effective" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_update_effective" ON public.funcionarios;
DROP POLICY IF EXISTS "funcionarios_delete_effective" ON public.funcionarios;

CREATE POLICY "funcionarios_select_effective" ON public.funcionarios FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "funcionarios_insert_effective" ON public.funcionarios FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "funcionarios_update_effective" ON public.funcionarios FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "funcionarios_delete_effective" ON public.funcionarios FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "mesas_select_effective" ON public.mesas;
DROP POLICY IF EXISTS "mesas_insert_effective" ON public.mesas;
DROP POLICY IF EXISTS "mesas_update_effective" ON public.mesas;
DROP POLICY IF EXISTS "mesas_delete_effective" ON public.mesas;

CREATE POLICY "mesas_select_effective" ON public.mesas FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "mesas_insert_effective" ON public.mesas FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "mesas_update_effective" ON public.mesas FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "mesas_delete_effective" ON public.mesas FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "transacoes_select_effective" ON public.transacoes;
DROP POLICY IF EXISTS "transacoes_insert_effective" ON public.transacoes;
DROP POLICY IF EXISTS "transacoes_update_effective" ON public.transacoes;
DROP POLICY IF EXISTS "transacoes_delete_effective" ON public.transacoes;

CREATE POLICY "transacoes_select_effective" ON public.transacoes FOR SELECT USING (user_id = public.get_effective_owner_id());
CREATE POLICY "transacoes_insert_effective" ON public.transacoes FOR INSERT WITH CHECK (user_id = public.get_effective_owner_id());
CREATE POLICY "transacoes_update_effective" ON public.transacoes FOR UPDATE USING (user_id = public.get_effective_owner_id());
CREATE POLICY "transacoes_delete_effective" ON public.transacoes FOR DELETE USING (user_id = public.get_effective_owner_id());

DROP POLICY IF EXISTS "produto_ingredientes_select_effective" ON public.produto_ingredientes;
DROP POLICY IF EXISTS "produto_ingredientes_insert_effective" ON public.produto_ingredientes;
DROP POLICY IF EXISTS "produto_ingredientes_delete_effective" ON public.produto_ingredientes;

CREATE POLICY "produto_ingredientes_select_effective" ON public.produto_ingredientes
  FOR SELECT USING (produto_id IN (SELECT id FROM public.produtos WHERE user_id = public.get_effective_owner_id()));

CREATE POLICY "produto_ingredientes_insert_effective" ON public.produto_ingredientes
  FOR INSERT WITH CHECK (produto_id IN (SELECT id FROM public.produtos WHERE user_id = public.get_effective_owner_id()));

CREATE POLICY "produto_ingredientes_delete_effective" ON public.produto_ingredientes
  FOR DELETE USING (produto_id IN (SELECT id FROM public.produtos WHERE user_id = public.get_effective_owner_id()));

DROP POLICY IF EXISTS "profiles_owner_readable_by_sub" ON public.profiles;
CREATE POLICY "profiles_owner_readable_by_sub" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (SELECT owner_id FROM public.sub_contas WHERE user_id = auth.uid())
  );
