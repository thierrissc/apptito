"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Phone, MapPin, Clock, Bike, CheckCircle, XCircle, Send, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency, getTimeSince } from "@/lib/formatters";
import type { DeliveryPedido, DeliveryItem } from "@/lib/types";
import { printDelivery } from "@/lib/print-utils";

interface DeliveryListProps {
  pedidos: DeliveryPedido[];
  loading: boolean;
  onUpdate: () => void;
  showActions?: boolean;
  currentTab?: "pendentes" | "cozinha" | "em_rota";
}

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
  preparando: { label: "Preparando", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Clock },
  saiu_entrega: { label: "Em Rota", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Bike },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

export function DeliveryList({ pedidos, loading, onUpdate, showActions, currentTab }: DeliveryListProps) {
  const supabase = createClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handlePrint = async (pedido: DeliveryPedido) => {
    const { data: itens } = await supabase
      .from("delivery_itens")
      .select("*")
      .eq("pedido_id", pedido.id);

    printDelivery({
      numero: pedido.numero,
      cliente_nome: pedido.cliente_nome,
      cliente_telefone: pedido.cliente_telefone,
      endereco: pedido.endereco,
      bairro: pedido.bairro,
      complemento: pedido.complemento,
      itens: (itens || []).map((item: DeliveryItem) => ({
        nome_produto: item.nome_produto,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
        observacoes: item.observacoes
      })),
      subtotal: pedido.subtotal,
      taxa_entrega: pedido.taxa_entrega,
      desconto: pedido.desconto,
      total: pedido.total,
      forma_pagamento: pedido.forma_pagamento,
      created_at: pedido.created_at,
      observacoes: pedido.observacoes
    }, true);
  };

  const updateStatus = async (id: string, status: DeliveryPedido["status"]) => {
    setUpdatingId(id);
    setActionError(null);
    const agora = new Date();
    const updateData: { status: string; entregue_em?: string } = { status };
    
    if (status === "entregue") {
      updateData.entregue_em = agora.toISOString();
    }

    const { error } = await supabase.from("delivery_pedidos").update(updateData).eq("id", id);
    
    if (error) {
      setActionError(`Erro ao atualizar pedido: ${error.message}`);
      setUpdatingId(null);
      onUpdate();
      return;
    }

    if (status === "entregue") {
      const { data: pedido } = await supabase
        .from("delivery_pedidos")
        .select("*")
        .eq("id", id)
        .single();

      if (pedido) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("transacoes").insert({
            user_id: pedido.user_id,
            tipo: "entrada",
            categoria: "Delivery",
            descricao: `Delivery #${pedido.numero} - ${pedido.cliente_nome}`,
            valor: pedido.total,
            data: agora.toISOString().split("T")[0],
            hora: agora.toTimeString().split(" ")[0],
            forma_pagamento: pedido.forma_pagamento || null,
          });

          const { data: caixaAberto } = await supabase
            .from("caixa")
            .select("*")
            .eq("user_id", pedido.user_id)
            .eq("status", "aberto")
            .maybeSingle();

          if (caixaAberto) {
            await supabase
              .from("caixa")
              .update({
                total_entradas: (Number(caixaAberto.total_entradas) || 0) + Number(pedido.total),
              })
              .eq("id", caixaAberto.id);
          }

          if (pedido.cliente_id) {
            const { data: cliente } = await supabase
              .from("clientes")
              .select("total_compras, quantidade_compras")
              .eq("id", pedido.cliente_id)
              .single();

            if (cliente) {
              await supabase.from("clientes").update({
                total_compras: (Number(cliente.total_compras) || 0) + Number(pedido.total),
                quantidade_compras: (Number(cliente.quantidade_compras) || 0) + 1,
                ultima_compra: agora.toISOString(),
              }).eq("id", pedido.cliente_id);
            }
          }
        }
      }
    }

    setUpdatingId(null);
    onUpdate();
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Nenhum pedido encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidos.map((pedido) => {
          const config = statusConfig[pedido.status];
          const StatusIcon = config.icon;

          return (
            <div key={pedido.id} className="bg-card rounded-xl p-5 flex flex-col gap-4 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-base">
                      #{pedido.numero}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{pedido.cliente_nome || "Cliente"}</h3>
                  <p className="text-sm text-muted-foreground">{getTimeSince(pedido.created_at)}</p>
                </div>
                <Badge className={config.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{pedido.endereco}</span>
                </div>
                {pedido.cliente_telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{pedido.cliente_telefone}</span>
                  </div>
                )}
              </div>

              {pedido.observacoes && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Observações:</p>
                  <p>{pedido.observacoes}</p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="text-sm text-muted-foreground">
                  <span>Subtotal: {formatCurrency(pedido.subtotal)}</span>
                  {pedido.taxa_entrega > 0 && (
                    <span className="ml-2">+ Taxa: {formatCurrency(pedido.taxa_entrega)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(pedido)}
                    className="bg-transparent"
                    title="Imprimir pedido"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold text-primary">{formatCurrency(pedido.total)}</span>
                </div>
              </div>

              {showActions && pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                <div className="flex gap-2">
                  {currentTab === "pendentes" && pedido.status === "pendente" && (
                    <Button 
                      onClick={() => updateStatus(pedido.id, "confirmado")} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Cozinha
                    </Button>
                  )}

                  {currentTab === "cozinha" && (
                    <>
                      {(pedido.status === "confirmado" || pedido.status === "preparando") && (
                        <Button 
                          onClick={() => updateStatus(pedido.id, "saiu_entrega")} 
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          <Bike className="h-4 w-4 mr-2" />
                          Saiu para Entrega
                        </Button>
                      )}
                    </>
                  )}

                  {currentTab === "em_rota" && pedido.status === "saiu_entrega" && (
                    <Button 
                      onClick={() => updateStatus(pedido.id, "entregue")} 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Entrega
                    </Button>
                  )}

                  <Button 
                    onClick={() => updateStatus(pedido.id, "cancelado")} 
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive/10 bg-transparent"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {(pedido.status === "cancelado" || pedido.status === "entregue") && (
                <Button 
                  onClick={async () => {
                    if (!confirm("Tem certeza que deseja excluir este pedido permanentemente?")) return;
                    await supabase.from("delivery_pedidos").delete().eq("id", pedido.id);
                    onUpdate();
                  }} 
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive hover:bg-destructive/10 bg-transparent"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Excluir Pedido
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
