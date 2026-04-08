import { createClient } from '@/lib/supabase/server'
import type { SubConta } from '@/lib/types'

export async function getEffectiveUserId(userId: string): Promise<string> {
  const supabase = await createClient()
  
  const { data: subConta } = await supabase
    .from('sub_contas')
    .select('owner_id')
    .eq('user_id', userId)
    .single()

  return subConta?.owner_id || userId
}

export async function validateSubContaPermission(
  userId: string,
  permission: keyof SubConta
): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: subConta } = await supabase
    .from('sub_contas')
    .select(permission)
    .eq('user_id', userId)
    .single()

  if (!subConta) {
    return true
  }

  return subConta[permission] === true
}

export async function getDiasAcesso(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data: subConta } = await supabase
    .from('sub_contas')
    .select('owner_id')
    .eq('user_id', userId)
    .single()

  const targetUserId = subConta?.owner_id || userId

  const { data: profile } = await supabase
    .from('profiles')
    .select('dias_acesso')
    .eq('id', targetUserId)
    .single()

  return profile?.dias_acesso || 0
}

export async function syncDiasAcessoForSubContas(ownerId: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('sub_contas')
    .update({ updated_at: new Date().toISOString() })
    .eq('owner_id', ownerId)
}
