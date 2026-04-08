import { createClient } from '@/lib/supabase/server'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'
import { Header } from '@/components/layout/header'
import { ProdutosClient } from '@/components/produtos/produtos-client'

export default async function ProdutosPage() {
  const supabase = await createClient()

  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId

  const [profile, { data: produtos }, { data: categorias }] = await Promise.all([
    getProfileForDisplay(),
    supabase.from('produtos').select('*').eq('user_id', uid).order('nome'),
    supabase.from('categorias').select('*').eq('user_id', uid).order('nome'),
  ])

  return (
    <div className="space-y-6">
      <Header title="Produtos" profile={profile} />
      <ProdutosClient
        produtosIniciais={produtos || []}
        categoriasIniciais={categorias || []}
        userId={uid}
      />
    </div>
  )
}
