CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    assinatura_inicio,
    assinatura_dias,
    dias_decorridos,
    status,
    tipo_conta,
    ativo,
    criado_em
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', ''),
    CURRENT_DATE,
    0, 
    0,
    'expirado', 
    'principal',
    true,
    NOW()
  );
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
