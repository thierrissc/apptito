'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FiltroButton } from '@/components/shared/filtro-button'
import { FuncionariosList } from '@/components/equipe/funcionarios-list'
import { CadastrarFuncionarioButton } from '@/components/equipe/cadastrar-funcionario-button'
import { EquipeStats } from '@/components/equipe/equipe-stats'
import { PontoRegistro } from '@/components/equipe/ponto-registro'
import { SubContasManager } from '@/components/equipe/sub-contas-manager'
import { usePermissions } from '@/hooks/use-permissions'
import type { Funcionario } from '@/lib/types'

interface EquipeClientProps {
  funcionariosIniciais: Funcionario[]
  userId: string
}

export function EquipeClient({ funcionariosIniciais, userId }: EquipeClientProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(funcionariosIniciais)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const { permissions } = usePermissions()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('user_id', userId)
      .order('nome')
    if (data) setFuncionarios(data)
    setLoading(false)
  }, [supabase, userId])

  const filteredFuncionarios = funcionarios.filter(
    f =>
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.cargo.toLowerCase().includes(search.toLowerCase())
  )

  const ativos = funcionarios.filter(f => f.ativo)
  const totalSalarios = ativos.reduce((acc, f) => acc + f.salario, 0)

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-3">
          <FiltroButton />
          <CadastrarFuncionarioButton onSuccess={fetchData} />
        </div>
      </div>

      <EquipeStats totalFuncionarios={ativos.length} totalSalarios={totalSalarios} />

      <Tabs defaultValue="funcionarios" className="w-full">
        <TabsList className="bg-card">
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="ponto">Registro de Ponto</TabsTrigger>
          {permissions.isOwner && (
            <TabsTrigger value="subcontas">Acessos do Sistema</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="funcionarios" className="mt-6">
          <FuncionariosList
            funcionarios={filteredFuncionarios}
            loading={loading}
            onUpdate={fetchData}
          />
        </TabsContent>

        <TabsContent value="ponto" className="mt-6">
          <PontoRegistro funcionarios={ativos} />
        </TabsContent>

        {permissions.isOwner && (
          <TabsContent value="subcontas" className="mt-6">
            <SubContasManager funcionarios={funcionarios} />
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
