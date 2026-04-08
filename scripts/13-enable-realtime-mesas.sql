BEGIN;

ALTER PUBLICATION supabase_realtime ADD TABLE mesas;

CREATE OR REPLACE FUNCTION public.atualizar_status_mesa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'fechada' OR NEW.status = 'cancelada' THEN
    IF NEW.mesa IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.comandas 
        WHERE user_id = NEW.user_id 
        AND mesa = NEW.mesa 
        AND status = 'aberta' 
        AND id != NEW.id
      ) THEN
        UPDATE public.mesas 
        SET status = 'disponivel', updated_at = NOW()
        WHERE user_id = NEW.user_id 
        AND numero = CAST(NEW.mesa AS INTEGER);
      END IF;
    END IF;
  ELSIF NEW.status = 'aberta' AND OLD.status IS NULL THEN
    IF NEW.mesa IS NOT NULL THEN
      UPDATE public.mesas 
      SET status = 'ocupada', updated_at = NOW()
      WHERE user_id = NEW.user_id 
      AND numero = CAST(NEW.mesa AS INTEGER);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_atualizar_status_mesa ON public.comandas;

CREATE TRIGGER trigger_atualizar_status_mesa
AFTER UPDATE ON public.comandas
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_status_mesa();

COMMIT;
