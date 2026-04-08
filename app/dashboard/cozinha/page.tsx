import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { CozinhaBoard } from '@/components/cozinha/cozinha-board'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

export default async function CozinhaPage() {
  const supabase = await createClient()
  
  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId
  
  const profile = await getProfileForDisplay()

  const { data: itensComanda } = await supabase
    .from('comanda_itens')
    .select(`
      *,
      comanda:comandas!inner(
        id, numero, mesa, status, user_id
      ),
      produto:produtos(
        id, nome, tempo_preparo
      )
    `)
    .eq('comanda.status', 'aberta')
    .in('status', ['pendente', 'preparando', 'pronto'])
    .order('created_at', { ascending: true })

  const { data: pedidosDelivery } = await supabase
    .from('delivery_pedidos')
    .select('*')
    .eq('user_id', userInfo.effectiveUserId || '')
    .in('status', ['confirmado', 'preparando'])
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <Header title="Cozinha" profile={profile} />
      <CozinhaBoard 
        itens={itensComanda || []} 
        pedidosDelivery={pedidosDelivery || []}
      />
    </div>
  )
}
