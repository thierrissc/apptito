import { createClient } from '@/lib/supabase/server'

export async function getEffectiveUserServer(): Promise<{
  userId: string
  effectiveUserId: string
  isSubConta: boolean
  ownerId: string | null
} | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: subConta, error: subContaError } = await supabase
    .from('sub_contas')
    .select('owner_id, ativo')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subContaError) {
    console.error('[v0] Erro ao buscar sub_conta:', subContaError.message)
  }

  if (subConta && subConta.owner_id) {
    if (!subConta.ativo) {
      return {
        userId: user.id,
        effectiveUserId: user.id,
        isSubConta: true,
        ownerId: subConta.owner_id,
      }
    }

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

export async function getProfileForDisplay() {
  const supabase = await createClient()
  const userInfo = await getEffectiveUserServer()
  
  if (!userInfo) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userInfo.effectiveUserId)
    .single()

  return data
}
