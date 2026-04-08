export interface UserPermissions {
  isOwner: boolean
  canEdit: boolean
  ownerId: string | null
  pode_ver_dashboard: boolean
  pode_ver_vendas: boolean
  pode_ver_comandas: boolean
  pode_ver_cozinha: boolean
  pode_ver_delivery: boolean
  pode_ver_produtos: boolean
  pode_ver_estoque: boolean
  pode_ver_clientes: boolean
  pode_ver_equipe: boolean
  pode_ver_fornecedores: boolean
  pode_ver_financeiro: boolean
  pode_ver_configuracoes: boolean
}
