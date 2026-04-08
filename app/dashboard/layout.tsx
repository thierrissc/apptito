'use client'

import React from "react"
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionsProvider } from '@/contexts/permissions-context'
import { ShieldAlert, Loader2 } from 'lucide-react'

const routePermissionMap: Record<string, string> = {
  '/dashboard': 'pode_ver_dashboard',
  '/dashboard/vendas': 'pode_ver_vendas',
  '/dashboard/comandas': 'pode_ver_comandas',
  '/dashboard/cozinha': 'pode_ver_cozinha',
  '/dashboard/delivery': 'pode_ver_delivery',
  '/dashboard/produtos': 'pode_ver_produtos',
  '/dashboard/estoque': 'pode_ver_estoque',
  '/dashboard/clientes': 'pode_ver_clientes',
  '/dashboard/equipe': 'pode_ver_equipe',
  '/dashboard/fornecedores': 'pode_ver_fornecedores',
  '/dashboard/financeiro': 'pode_ver_financeiro',
  '/dashboard/configuracoes': 'pode_ver_configuracoes',
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { permissions, loading } = usePermissions()

  const requiredPermission = routePermissionMap[pathname]
  const hasAccess = !requiredPermission || permissions[requiredPermission as keyof typeof permissions]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-20 min-h-screen p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasAccess ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <ShieldAlert className="h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold text-foreground">Acesso Restrito</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Voce nao tem permissao para acessar esta pagina. Entre em contato com o administrador do sistema.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PermissionsProvider>
      <DashboardContent>{children}</DashboardContent>
    </PermissionsProvider>
  )
}
