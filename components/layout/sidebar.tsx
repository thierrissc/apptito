'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import {
  Home,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  FileText,
  UtensilsCrossed,
  Truck,
  UserCog,
  ChefHat,
  Building2,
  Loader2,
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', permission: 'pode_ver_dashboard' },
  { href: '/dashboard/financeiro', icon: DollarSign, label: 'Financeiro', permission: 'pode_ver_financeiro' },
  { href: '/dashboard/estoque', icon: Package, label: 'Estoque', permission: 'pode_ver_estoque' },
  { href: '/dashboard/fornecedores', icon: Building2, label: 'Fornecedores', permission: 'pode_ver_fornecedores' },
  { href: '/dashboard/clientes', icon: Users, label: 'Clientes', permission: 'pode_ver_clientes' },
  { href: '/dashboard/vendas', icon: ShoppingCart, label: 'Vendas/Caixa', permission: 'pode_ver_vendas' },
  { href: '/dashboard/comandas', icon: FileText, label: 'Comandas', permission: 'pode_ver_comandas' },
  { href: '/dashboard/cozinha', icon: ChefHat, label: 'Cozinha', permission: 'pode_ver_cozinha' },
  { href: '/dashboard/produtos', icon: UtensilsCrossed, label: 'Produtos', permission: 'pode_ver_produtos' },
  { href: '/dashboard/delivery', icon: Truck, label: 'Delivery', permission: 'pode_ver_delivery' },
  { href: '/dashboard/equipe', icon: UserCog, label: 'Equipe', permission: 'pode_ver_equipe' },
] as const

type PermissionKey = typeof menuItems[number]['permission']

export function Sidebar() {
  const pathname = usePathname()
  const { permissions, loading } = usePermissions()

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col items-center justify-center bg-card py-6 shadow-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </aside>
    )
  }

  const visibleMenuItems = menuItems.filter(item => {
    return permissions[item.permission as PermissionKey]
  })

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col items-center bg-card py-6 shadow-lg">
      <nav className="flex flex-1 flex-col items-center gap-2">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={item.label}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="sr-only">{item.label}</span>
              
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-sm text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
