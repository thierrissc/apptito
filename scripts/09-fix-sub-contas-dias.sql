ALTER TABLE public.sub_contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_contas_owner_select" ON public.sub_contas;
DROP POLICY IF EXISTS "sub_contas_owner_insert" ON public.sub_contas;
DROP POLICY IF EXISTS "sub_contas_owner_update" ON public.sub_contas;
DROP POLICY IF EXISTS "sub_contas_owner_delete" ON public.sub_contas;
DROP POLICY IF EXISTS "sub_contas_self_select" ON public.sub_contas;

CREATE POLICY "sub_contas_owner_select" ON public.sub_contas
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "sub_contas_owner_insert" ON public.sub_contas
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "sub_contas_owner_update" ON public.sub_contas
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "sub_contas_owner_delete" ON public.sub_contas
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "sub_contas_self_select" ON public.sub_contas
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_owner_readable_by_sub" ON public.profiles;
CREATE POLICY "profiles_owner_readable_by_sub" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR id IN (
      SELECT owner_id FROM public.sub_contas WHERE user_id = auth.uid()
    )
  );
