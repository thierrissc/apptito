import { createClient } from '@/lib/supabase/server'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'
import { Header } from '@/components/layout/header'
import { DeliveryClient } from '@/components/delivery/delivery-client'

export default async function DeliveryPage() {
  const supabase = await createClient()

  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId

  const [profile, { data: pedidos }, { data: produtos }, { data: clientes }] = await Promise.all([
    getProfileForDisplay(),
    supabase
      .from('delivery_pedidos')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false }),
    supabase
      .from('produtos')
      .select('*')
      .eq('user_id', uid)
      .eq('disponivel', true)
      .order('nome'),
    supabase
      .from('clientes')
      .select('*')
      .eq('user_id', uid)
      .order('nome'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <Header title="Delivery" profile={profile} />
      <DeliveryClient
        pedidosIniciais={pedidos || []}
        produtosIniciais={produtos || []}
        clientesIniciais={clientes || []}
        userId={uid}
      />
    </div>
  )
}
