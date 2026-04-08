import { createClient } from '@/lib/supabase/server'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'
import { Header } from '@/components/layout/header'
import { EquipeClient } from '@/components/equipe/equipe-client'

export default async function EquipePage() {
  const supabase = await createClient()

  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId

  const [profile, { data: funcionarios }] = await Promise.all([
    getProfileForDisplay(),
    supabase
      .from('funcionarios')
      .select('*')
      .eq('user_id', uid)
      .order('nome'),
  ])

  return (
    <div className="space-y-6">
      <Header title="Gestão de Equipe" profile={profile} />
      <EquipeClient funcionariosIniciais={funcionarios || []} userId={uid} />
    </div>
  )
}
