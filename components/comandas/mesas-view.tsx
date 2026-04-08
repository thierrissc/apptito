'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import { Eye, CheckCircle, XCircle, Users, Plus, Settings } from 'lucide-react'
import type { Comanda, Produto, Mesa } from '@/lib/types'
import { VerComandaDialog } from './ver-comanda-dialog'
import { FecharComandaDialog } from './fechar-comanda-dialog'
import { createClient } from '@/lib/supabase/client'
import { cancelarComanda } from '@/lib/actions/estoque-actions'

interface MesasViewProps {
  comandas: Comanda[]
  produtos: Produto[]
}

interface MesaInfo {
  id: string
  numero: number
  status: string
  comandas: Comanda[]
  total: number
  responsavel: string | null
}

export function MesasView({ comandas, produtos }: MesasViewProps) {
  const [mesas, setMesas] = useState<MesaInfo[]>([])
  const [selectedMesa, setSelectedMesa] = useState<MesaInfo | null>(null)
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [closingComanda, setClosingComanda] = useState<Comanda | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadMesas() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let { data: mesasData } = await supabase
        .from('mesas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('numero')

      if (!mesasData || mesasData.length === 0) {
        const defaultMesas = Array.from({ length: 10 }, (_, i) => ({
          user_id: user.id,
          numero: i + 1,
          capacidade: 4,
          status: 'disponivel'
        }))
        await supabase.from('mesas').insert(defaultMesas)
        const result = await supabase
          .from('mesas')
          .select('*')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('numero')
        mesasData = result.data
      }

      const abertas = comandas.filter(c => c.status === 'aberta')
      const mesasInfo: MesaInfo[] = (mesasData || []).map(mesa => {
        const mesaComandas = abertas.filter(c => c.mesa === String(mesa.numero))
        const total = mesaComandas.reduce((acc, c) => acc + c.total, 0)
        const responsavel = mesaComandas[0]?.funcionario?.nome || null
        return {
          id: mesa.id,
          numero: mesa.numero,
          status: mesaComandas.length > 0 ? 'ocupada' : 'disponivel',
          comandas: mesaComandas,
          total,
          responsavel
        }
      })

      const balcaoComandas = abertas.filter(c => !c.mesa || c.mesa === 'Balcão')
      if (balcaoComandas.length > 0 || true) {
        mesasInfo.unshift({
          id: 'balcao',
          numero: 0,
          status: balcaoComandas.length > 0 ? 'ocupada' : 'disponivel',
          comandas: balcaoComandas,
          total: balcaoComandas.reduce((acc, c) => acc + c.total, 0),
          responsavel: balcaoComandas[0]?.funcionario?.nome || null
        })
      }

      setMesas(mesasInfo)
    }
    loadMesas()
  }, [comandas])

  async function handleCancelar(id: string) {
    if (!confirm('Tem certeza que deseja cancelar esta comanda?')) return
    await cancelarComanda(id)
    router.refresh()
  }

  const statusColors = {
    disponivel: 'bg-muted text-muted-foreground border-muted',
    ocupada: 'bg-primary/10 text-primary border-primary',
    reservada: 'bg-amber-500/10 text-amber-600 border-amber-500',
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mesas.map((mesa) => (
          <Card
            key={mesa.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
              mesa.status === 'ocupada' ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted-foreground/20'
            }`}
            onClick={() => setSelectedMesa(mesa)}
          >
            <div className="text-center space-y-2">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                mesa.status === 'ocupada' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {mesa.numero === 0 ? (
                  <Users className="h-6 w-6" />
                ) : (
                  <span className="text-xl font-bold">{mesa.numero}</span>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {mesa.numero === 0 ? 'Balcão' : `Mesa ${mesa.numero}`}
                </p>
                {mesa.status === 'ocupada' ? (
                  <>
                    <Badge variant="outline" className="border-primary text-primary text-xs mt-1">
                      {mesa.comandas.length} comanda{mesa.comandas.length !== 1 ? 's' : ''}
                    </Badge>
                    <p className="text-sm font-medium text-primary mt-1">{formatCurrency(mesa.total)}</p>
                    {mesa.responsavel && (
                      <p className="text-xs text-muted-foreground truncate">{mesa.responsavel}</p>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs mt-1">
                    Disponível
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedMesa} onOpenChange={(open) => !open && setSelectedMesa(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedMesa?.numero === 0 ? 'Balcão' : `Mesa ${selectedMesa?.numero}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedMesa?.comandas.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma comanda aberta</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedMesa?.comandas.map((comanda) => (
                  <Card key={comanda.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Comanda #{comanda.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {comanda.funcionario?.nome || 'Sem responsável'} • {formatRelativeTime(comanda.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-primary">{formatCurrency(comanda.total)}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedComanda(comanda)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-success"
                          onClick={() => setClosingComanda(comanda)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleCancelar(comanda.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {selectedMesa && (
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold text-foreground">Total da Mesa</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(selectedMesa.total)}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedComanda && (
        <VerComandaDialog
          comanda={selectedComanda}
          open={!!selectedComanda}
          onOpenChange={(open) => !open && setSelectedComanda(null)}
        />
      )}

      {closingComanda && (
        <FecharComandaDialog
          comanda={closingComanda}
          open={!!closingComanda}
          onOpenChange={(open) => !open && setClosingComanda(null)}
        />
      )}
    </>
  )
}
