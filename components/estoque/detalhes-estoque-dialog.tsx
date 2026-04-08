'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Estoque, CompraItem, Compra, Fornecedor } from '@/lib/types'
import { Package, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'

interface DetalhesEstoqueDialogProps {
  item: Estoque | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface HistoricoCompra {
  id: string
  data_compra: string
  quantidade: number
  custo_unitario: number
  custo_total: number
  validade: string | null
  fornecedor_nome: string | null
}

export function DetalhesEstoqueDialog({ item, open, onOpenChange }: DetalhesEstoqueDialogProps) {
  const [historico, setHistorico] = useState<HistoricoCompra[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadHistorico() {
      if (!item || !open) return
      setLoading(true)
      
      const supabase = createClient()
      const { data } = await supabase
        .from('compra_itens')
        .select(`
          id,
          quantidade,
          custo_unitario,
          custo_total,
          validade,
          compra:compras(data_compra, fornecedor:fornecedores(nome))
        `)
        .eq('estoque_id', item.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) {
        const historico = data.map((h: any) => ({
          id: h.id,
          data_compra: h.compra?.data_compra || '',
          quantidade: h.quantidade,
          custo_unitario: h.custo_unitario,
          custo_total: h.custo_total,
          validade: h.validade,
          fornecedor_nome: h.compra?.fornecedor?.nome || null
        }))
        setHistorico(historico)
      }
      setLoading(false)
    }
    
    loadHistorico()
  }, [item, open])

  if (!item) return null

  const custoMedio = historico.length > 0 
    ? historico.reduce((acc, h) => acc + h.custo_unitario, 0) / historico.length 
    : item.custo_unitario

  const custoVariacao = historico.length >= 2
    ? ((historico[0].custo_unitario - historico[1].custo_unitario) / historico[1].custo_unitario) * 100
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {item.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Quantidade Atual</p>
              <p className="text-2xl font-bold text-foreground">
                {item.quantidade.toFixed(2)} {item.unidade}
              </p>
              {item.quantidade <= item.quantidade_minima && (
                <Badge variant="destructive" className="mt-1">Estoque Baixo</Badge>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Custo Unitário</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(item.custo_unitario)}</p>
              {custoVariacao !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${custoVariacao > 0 ? 'text-destructive' : 'text-success'}`}>
                  {custoVariacao > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(custoVariacao).toFixed(1)}%
                </div>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Custo Médio</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(custoMedio)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Valor em Estoque</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(item.quantidade * item.custo_unitario)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Quantidade Mínima</p>
              <p className="font-medium">{item.quantidade_minima} {item.unidade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Compra</p>
              <p className="font-medium">{item.ultima_compra ? formatDate(item.ultima_compra) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próxima Validade</p>
              <p className="font-medium">{item.proxima_validade ? formatDate(item.proxima_validade) : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fornecedor Principal</p>
              <p className="font-medium">{item.fornecedor || '-'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Histórico de Compras
            </h3>
            
            {loading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
            ) : historico.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma compra registrada</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 text-sm">
                      <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Fornecedor</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">QTD</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Custo Unit.</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Validade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historico.map((h) => (
                      <tr key={h.id} className="text-sm">
                        <td className="p-3">{formatDate(h.data_compra)}</td>
                        <td className="p-3 text-muted-foreground">{h.fornecedor_nome || '-'}</td>
                        <td className="p-3 text-right">{h.quantidade.toFixed(2)}</td>
                        <td className="p-3 text-right">{formatCurrency(h.custo_unitario)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(h.custo_total)}</td>
                        <td className="p-3">{h.validade ? formatDate(h.validade) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
