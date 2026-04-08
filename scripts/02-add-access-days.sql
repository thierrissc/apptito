ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dias_acesso INTEGER DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_proximo_decremento DATE DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_acesso TEXT DEFAULT 'ativo' CHECK (status_acesso IN ('ativo', 'expirado', 'suspenso'));

CREATE OR REPLACE FUNCTION decrementar_dias_acesso()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    dias_acesso = GREATEST(dias_acesso - 1, 0),
    data_proximo_decremento = CURRENT_DATE + INTERVAL '1 day',
    status_acesso = CASE 
      WHEN dias_acesso - 1 <= 0 THEN 'expirado'
      ELSE 'ativo'
    END,
    updated_at = NOW()
  WHERE 
    data_proximo_decremento <= CURRENT_DATE 
    AND dias_acesso > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_access_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dias_acesso <= 0 THEN
    NEW.status_acesso = 'expirado';
  ELSIF NEW.dias_acesso > 0 THEN
    NEW.status_acesso = 'ativo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_access_status ON profiles;
CREATE TRIGGER trigger_check_access_status
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_access_status();

CREATE OR REPLACE FUNCTION adicionar_dias_acesso(user_id UUID, dias_adicionar INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    dias_acesso = dias_acesso + dias_adicionar,
    status_acesso = 'ativo',
    data_proximo_decremento = CURRENT_DATE + INTERVAL '1 day',
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.run_daily_access_decrement()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM decrementar_dias_acesso();
END;
$$;
