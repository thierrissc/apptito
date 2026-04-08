CREATE TABLE IF NOT EXISTS public.comanda_item_historico (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  comanda_item_id uuid NOT NULL REFERENCES public.comanda_itens(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  mudado_em timestamp with time zone NOT NULL DEFAULT now(),
  constraint comanda_item_historico_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_comanda_item_historico_item_id 
  ON public.comanda_item_historico(comanda_item_id);

CREATE OR REPLACE FUNCTION registrar_mudanca_status_item()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.comanda_item_historico (comanda_item_id, status_anterior, status_novo)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_registrar_status_item ON public.comanda_itens;
CREATE TRIGGER trigger_registrar_status_item
AFTER UPDATE ON public.comanda_itens
FOR EACH ROW
EXECUTE FUNCTION registrar_mudanca_status_item();

CREATE OR REPLACE VIEW public.comandas_status_cozinha AS
SELECT 
  c.id,
  c.numero,
  c.status,
  COUNT(DISTINCT ci.id) as total_itens,
  COUNT(DISTINCT CASE WHEN ci.status = 'pendente' THEN ci.id END) as itens_pendentes,
  COUNT(DISTINCT CASE WHEN ci.status = 'preparando' THEN ci.id END) as itens_preparando,
  COUNT(DISTINCT CASE WHEN ci.status = 'pronto' THEN ci.id END) as itens_prontos,
  COUNT(DISTINCT CASE WHEN ci.status = 'entregue' THEN ci.id END) as itens_entregues,
  COUNT(DISTINCT CASE WHEN ci.status = 'cancelado' THEN ci.id END) as itens_cancelados,
  CASE 
    WHEN COUNT(CASE WHEN ci.status = 'pendente' THEN 1 END) > 0 THEN 'pendente'
    WHEN COUNT(CASE WHEN ci.status = 'preparando' THEN 1 END) > 0 THEN 'preparando'
    WHEN COUNT(CASE WHEN ci.status = 'pronto' THEN 1 END) > 0 AND COUNT(CASE WHEN ci.status != 'entregue' AND ci.status != 'cancelado' THEN 1 END) = 0 THEN 'pronto'
    ELSE 'entregue'
  END as status_geral
FROM public.comandas c
LEFT JOIN public.comanda_itens ci ON c.id = ci.comanda_id
WHERE c.status = 'aberta'
GROUP BY c.id, c.numero, c.status;

ALTER PUBLICATION supabase_realtime ADD TABLE public.comanda_item_historico;
