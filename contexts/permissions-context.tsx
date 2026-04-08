"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserPermissions } from '@/lib/permissions-types'

const defaultOwnerPermissions: UserPermissions = {
  isOwner: true,
  canEdit: true,
  ownerId: null,
  pode_ver_dashboard: true,
  pode_ver_vendas: true,
  pode_ver_comandas: true,
  pode_ver_cozinha: true,
  pode_ver_delivery: true,
  pode_ver_produtos: true,
  pode_ver_estoque: true,
  pode_ver_clientes: true,
  pode_ver_equipe: true,
  pode_ver_fornecedores: true,
  pode_ver_financeiro: true,
  pode_ver_configuracoes: true,
}

interface PermissionsContextValue {
  permissions: UserPermissions
  loading: boolean
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: defaultOwnerPermissions,
  loading: true,
})

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions>(defaultOwnerPermissions)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isCancelled = false

    const fetchPermissions = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (isCancelled) return

        if (userError || !user) {
          setLoading(false)
          return
        }

        const { data: subConta, error: subError } = await supabase
          .from('sub_contas')
          .select(`
            ativo,
            pode_editar,
            owner_id,
            pode_ver_dashboard,
            pode_ver_vendas,
            pode_ver_comandas,
            pode_ver_cozinha,
            pode_ver_delivery,
            pode_ver_produtos,
            pode_ver_estoque,
            pode_ver_clientes,
            pode_ver_equipe,
            pode_ver_fornecedores,
            pode_ver_financeiro,
            pode_ver_configuracoes
          `)
          .eq('user_id', user.id)
          .maybeSingle()

        if (isCancelled) return

        if (!subError && subConta) {
          if (!subConta.ativo) {
            setPermissions({
              isOwner: false,
              canEdit: false,
              ownerId: subConta.owner_id,
              pode_ver_dashboard: false,
              pode_ver_vendas: false,
              pode_ver_comandas: false,
              pode_ver_cozinha: false,
              pode_ver_delivery: false,
              pode_ver_produtos: false,
              pode_ver_estoque: false,
              pode_ver_clientes: false,
              pode_ver_equipe: false,
              pode_ver_fornecedores: false,
              pode_ver_financeiro: false,
              pode_ver_configuracoes: false,
            })
          } else {
            setPermissions({
              isOwner: false,
              canEdit: subConta.pode_editar ?? false,
              ownerId: subConta.owner_id,
              pode_ver_dashboard: subConta.pode_ver_dashboard ?? false,
              pode_ver_vendas: subConta.pode_ver_vendas ?? false,
              pode_ver_comandas: subConta.pode_ver_comandas ?? false,
              pode_ver_cozinha: subConta.pode_ver_cozinha ?? false,
              pode_ver_delivery: subConta.pode_ver_delivery ?? false,
              pode_ver_produtos: subConta.pode_ver_produtos ?? false,
              pode_ver_estoque: subConta.pode_ver_estoque ?? false,
              pode_ver_clientes: subConta.pode_ver_clientes ?? false,
              pode_ver_equipe: subConta.pode_ver_equipe ?? false,
              pode_ver_fornecedores: subConta.pode_ver_fornecedores ?? false,
              pode_ver_financeiro: subConta.pode_ver_financeiro ?? false,
              pode_ver_configuracoes: subConta.pode_ver_configuracoes ?? false,
            })
          }
        } else {
          setPermissions(defaultOwnerPermissions)
        }
      } catch {
        if (!isCancelled) setPermissions(defaultOwnerPermissions)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchPermissions()
    return () => { isCancelled = true }
  }, [supabase])

  const value = useMemo(() => ({ permissions, loading }), [permissions, loading])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  return useContext(PermissionsContext)
}
