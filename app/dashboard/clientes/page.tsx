import { createClient } from '@/lib/supabase/server'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'
import { Header } from '@/components/layout/header'
import { ClientesClient } from '@/components/clientes/clientes-client'

export default async function ClientesPage() {
  const supabase = await createClient()

  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId

  const [profile, { data: clientes }] = await Promise.all([
    getProfileForDisplay(),
    supabase
      .from('clientes')
      .select('*')
      .eq('user_id', uid)
      .order('nome', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <Header title="Clientes" profile={profile} />
      <ClientesClient clientesIniciais={clientes || []} userId={uid} />
    </div>
  )
}
