ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_itens;

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_pedidos;

CREATE INDEX IF NOT EXISTS idx_comanda_itens_comanda_status ON public.comanda_itens(comanda_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_pedidos_user_status ON public.delivery_pedidos(user_id, status);
