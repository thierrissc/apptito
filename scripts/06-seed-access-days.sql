UPDATE profiles
SET 
  dias_acesso = 30,
  status_acesso = 'ativo',
  data_proximo_decremento = CURRENT_DATE + INTERVAL '1 day',
  updated_at = NOW()
WHERE dias_acesso IS NULL OR dias_acesso = 0;
