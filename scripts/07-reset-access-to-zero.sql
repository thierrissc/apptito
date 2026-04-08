UPDATE public.profiles
SET 
  dias_acesso = 0,
  status_acesso = 'ativo',
  data_proximo_decremento = CURRENT_DATE
WHERE 
  dias_acesso IS NOT NULL;

SELECT id, email, nome, dias_acesso, status_acesso, data_proximo_decremento
FROM public.profiles
ORDER BY nome;
