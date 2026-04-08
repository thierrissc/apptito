import { createClient as createServerClient } from '@/lib/supabase/server'

export interface AccessStatus {
  isActive: boolean
  status: 'ativo' | 'expirado' | 'suspenso'
  remainingDays: number
  message: string
}

export async function decrementAccessDaysIfNeeded(
  userId: string,
  supabaseClient?: Awaited<ReturnType<typeof createServerClient>>,
) {
  try {
    const client = supabaseClient || (await createServerClient())

    const { data: profile, error: fetchError } = await client
      .from('profiles')
      .select('data_proximo_decremento, dias_acesso')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      console.error('[v0] Error fetching profile:', fetchError)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const nextDecrement = profile.data_proximo_decremento

    const shouldDecrement = nextDecrement && today >= nextDecrement

    if (shouldDecrement && profile.dias_acesso > 0) {
      const newDays = Math.max(0, profile.dias_acesso - 1)

      const { error: updateError } = await client
        .from('profiles')
        .update({
          dias_acesso: newDays,
          data_proximo_decremento: new Date(Date.now() + 86400000)
            .toISOString()
            .split('T')[0],
          status_acesso: newDays === 0 ? 'expirado' : 'ativo',
        })
        .eq('id', userId)

      if (updateError) {
        console.error('[v0] Error updating access days:', updateError)
      }
    }
  } catch (error) {
    console.error('[v0] Error in decrementAccessDaysIfNeeded:', error)
  }
}

export async function checkAccessStatus(
  userId: string,
  supabaseClient?: Awaited<ReturnType<typeof createServerClient>>,
): Promise<AccessStatus> {
  try {
    const client = supabaseClient || (await createServerClient())

    const { data: subConta } = await client
      .from('sub_contas')
      .select('owner_id, ativo')
      .eq('user_id', userId)
      .maybeSingle()

    if (subConta && !subConta.ativo) {
      return {
        isActive: false,
        status: 'suspenso',
        remainingDays: 0,
        message: 'Acesso suspenso. Contate o administrador.',
      }
    }

    const effectiveUserId = subConta?.owner_id ?? userId

    if (!subConta) {
      await decrementAccessDaysIfNeeded(effectiveUserId, client)
    }

    const { data: profile, error } = await client
      .from('profiles')
      .select('dias_acesso, status_acesso')
      .eq('id', effectiveUserId)
      .single()

    if (error || !profile) {
      return {
        isActive: false,
        status: 'expirado',
        remainingDays: 0,
        message: 'Usuário não encontrado',
      }
    }

    const isActive = profile.status_acesso === 'ativo'
    const remainingDays = profile.dias_acesso || 0

    return {
      isActive,
      status: profile.status_acesso,
      remainingDays,
      message: isActive
        ? `Acesso ativo (${remainingDays} dias restantes)`
        : remainingDays === 0
          ? 'Acesso expirado. Contate o administrador.'
          : 'Acesso suspenso. Contate o administrador.',
    }
  } catch (error) {
    console.error('[v0] Error checking access status:', error)
    return {
      isActive: false,
      status: 'expirado',
      remainingDays: 0,
      message: 'Erro ao verificar acesso',
    }
  }
}

export async function addAccessDays(
  userId: string,
  daysToAdd: number,
  supabaseClient?: Awaited<ReturnType<typeof createServerClient>>,
) {
  try {
    const client = supabaseClient || (await createServerClient())

    const { data: profile, error: fetchError } = await client
      .from('profiles')
      .select('dias_acesso')
      .eq('id', userId)
      .single()

    if (fetchError || !profile) {
      throw new Error('Usuário não encontrado')
    }

    const currentDays = profile.dias_acesso || 0
    const newDays = currentDays + daysToAdd
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const { error: updateError } = await client
      .from('profiles')
      .update({
        dias_acesso: newDays,
        status_acesso: 'ativo',
        data_proximo_decremento: tomorrow,
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return {
      success: true,
      newDays,
      message: `${daysToAdd} dias adicionados com sucesso. Total: ${newDays} dias.`,
    }
  } catch (error) {
    console.error('[v0] Error adding access days:', error)
    return {
      success: false,
      newDays: 0,
      message:
        error instanceof Error ? error.message : 'Erro ao adicionar dias',
    }
  }
}
