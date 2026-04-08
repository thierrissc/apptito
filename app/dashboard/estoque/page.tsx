import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { EstoqueList } from '@/components/estoque/estoque-list'
import { CadastrarProdutoButton } from '@/components/estoque/cadastrar-produto-button'
import { LancarCompraButton } from '@/components/estoque/lancar-compra-button'
import { FornecedoresButton } from '@/components/estoque/fornecedores-button'
import { FiltroButton } from '@/components/shared/filtro-button'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

export default async function EstoquePage() {
  const supabase = await createClient()
  
  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId
  
  const profile = await getProfileForDisplay()

  const { data: estoque } = await supabase
    .from('estoque')
    .select('*')
    .eq('user_id', uid)
    .order('nome', { ascending: true })

  return (
    <div className="space-y-6">
      <Header title="Estoque" profile={profile}>
        <FiltroButton />
        <FornecedoresButton />
        <CadastrarProdutoButton />
        <LancarCompraButton estoqueItems={estoque || []} />
      </Header>

      <EstoqueList items={estoque || []} />
    </div>
  )
}
