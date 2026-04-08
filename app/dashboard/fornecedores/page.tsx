import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { FornecedoresList } from '@/components/fornecedores/fornecedores-list'
import { CadastrarFornecedorButton } from '@/components/fornecedores/cadastrar-fornecedor-button'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

export default async function FornecedoresPage() {
  const supabase = await createClient()
  
  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId
  
  const profile = await getProfileForDisplay()

  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('user_id', uid)
    .order('nome', { ascending: true })

  return (
    <div className="space-y-6">
      <Header title="Fornecedores" profile={profile}>
        <CadastrarFornecedorButton />
      </Header>

      <FornecedoresList fornecedores={fornecedores || []} />
    </div>
  )
}
