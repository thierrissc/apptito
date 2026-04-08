
CREATE OR REPLACE FUNCTION decrement_access_days()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    assinatura_dias = GREATEST(assinatura_dias - 1, 0),
    assinatura_status = CASE 
      WHEN assinatura_dias - 1 <= 0 THEN 'expirado'
      ELSE assinatura_status
    END,
    updated_at = NOW()
  WHERE 
    assinatura_status = 'ativo'
    AND assinatura_dias > 0
    AND assinatura_inicio IS NOT NULL
    AND DATE(updated_at) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS daily_task_logs (
  id bigserial PRIMARY KEY,
  task_name text NOT NULL,
  last_run_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE OR REPLACE FUNCTION check_and_decrement_days()
RETURNS void AS $$
DECLARE
  v_last_run date;
BEGIN
  SELECT last_run_date INTO v_last_run FROM daily_task_logs 
  WHERE task_name = 'decrement_access_days'
  LIMIT 1;

  IF v_last_run IS NULL OR v_last_run < CURRENT_DATE THEN
    PERFORM decrement_access_days();
    
    INSERT INTO daily_task_logs (task_name, last_run_date, updated_at)
    VALUES ('decrement_access_days', CURRENT_DATE, NOW())
    ON CONFLICT (task_name) WHERE task_name = 'decrement_access_days'
    DO UPDATE SET 
      last_run_date = CURRENT_DATE,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION decrement_access_days() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_decrement_days() TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_access_days() TO anon;
GRANT EXECUTE ON FUNCTION check_and_decrement_days() TO anon;
