import { createClient } from '@/lib/supabase/client'

export async function getEffectiveUserId(): Promise<{ userId: string; effectiveUserId: string; isSubConta: boolean; ownerId: string | null } | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: subConta } = await supabase
    .from('sub_contas')
    .select('owner_id, ativo')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subConta && subConta.owner_id) {
    return {
      userId: user.id,
      effectiveUserId: subConta.owner_id,
      isSubConta: true,
      ownerId: subConta.owner_id,
    }
  }

  return {
    userId: user.id,
    effectiveUserId: user.id,
    isSubConta: false,
    ownerId: null,
  }
}
