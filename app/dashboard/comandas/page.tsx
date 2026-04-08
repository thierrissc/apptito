import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MesasView } from '@/components/comandas/mesas-view'
import { ComandasHistorico } from '@/components/comandas/comandas-historico'
import { NovaComandaButton } from '@/components/comandas/nova-comanda-button'
import { FiltroButton } from '@/components/shared/filtro-button'
import { ComandasList } from '@/components/comandas/comandas-list'
import { getEffectiveUserServer, getProfileForDisplay } from '@/lib/get-effective-user-server'

export default async function ComandasPage() {
  const supabase = await createClient()
  
  const userInfo = await getEffectiveUserServer()
  if (!userInfo) return null
  const uid = userInfo.effectiveUserId
  
  const profile = await getProfileForDisplay()

  const { data: comandas } = await supabase
    .from('comandas')
    .select('*, funcionario:funcionarios(nome), cliente:clientes(nome)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })

  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, categoria:categorias(nome)')
    .eq('user_id', uid)
    .eq('disponivel', true)
    .order('nome', { ascending: true })

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('user_id', uid)
    .order('nome', { ascending: true })

  const { data: funcionarios } = await supabase
    .from('funcionarios')
    .select('*')
    .eq('user_id', uid)
    .eq('ativo', true)
    .order('nome', { ascending: true })

  return (
    <div className="space-y-6">
      <Header title="Comandas" profile={profile}>
        <FiltroButton />
        <NovaComandaButton 
          produtos={produtos || []}
          clientes={clientes || []}
          funcionarios={funcionarios || []}
        />
      </Header>

      <MesasView 
        comandas={comandas || []} 
        produtos={produtos || []}
      />

      <ComandasHistorico 
        comandas={comandas || []} 
      />
    </div>
  )
}
