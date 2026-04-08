"use client";

import React from "react"

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Minus, Trash2, Banknote, CreditCard, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { getEffectiveUserId } from "@/lib/get-effective-user";
import type { Produto, Cliente } from "@/lib/types";

interface NovoPedidoButtonProps {
  produtos: Produto[];
  clientes: Cliente[];
  onSuccess: () => void;
}

interface ItemPedido {
  produto_id: string;
  nome: string;
  quantidade: number;
  preco: number;
}

export function NovoPedidoButton({ produtos, clientes, onSuccess }: NovoPedidoButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [taxaEntrega, setTaxaEntrega] = useState("");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [selectedProduto, setSelectedProduto] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const formasPagamento = [
    { value: "dinheiro", label: "Dinheiro", icon: Banknote },
    { value: "pix", label: "PIX", icon: QrCode },
    { value: "credito", label: "Cartão Crédito", icon: CreditCard },
    { value: "debito", label: "Cartão Débito", icon: CreditCard },
  ];

  const handleClienteChange = (id: string) => {
    setClienteId(id);
    const cliente = clientes.find(c => c.id === id);
    if (cliente) {
      setClienteNome(cliente.nome);
      setTelefone(cliente.telefone || "");
      setEndereco(cliente.endereco || "");
    }
  };

  const addItem = () => {
    if (!selectedProduto) return;
    const produto = produtos.find(p => p.id === selectedProduto);
    if (!produto) return;

    const existingIndex = itens.findIndex(i => i.produto_id === selectedProduto);
    if (existingIndex >= 0) {
      const updated = [...itens];
      updated[existingIndex].quantidade += 1;
      setItens(updated);
    } else {
      setItens([...itens, {
        produto_id: produto.id,
        nome: produto.nome,
        quantidade: 1,
        preco: produto.preco,
      }]);
    }
    setSelectedProduto("");
  };

  const updateQuantidade = (index: number, delta: number) => {
    const updated = [...itens];
    updated[index].quantidade += delta;
    if (updated[index].quantidade <= 0) {
      updated.splice(index, 1);
    }
    setItens(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...itens];
    updated.splice(index, 1);
    setItens(updated);
  };

  const subtotal = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const taxa = parseFloat(taxaEntrega) || 0;
  const total = subtotal + taxa;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itens.length === 0 || !endereco.trim()) return;

    setLoading(true);
    setError(null);

    const userInfo = await getEffectiveUserId();
    if (!userInfo) {
      setError("Voce precisa estar logado para criar um pedido.");
      setLoading(false);
      return;
    }

    const effectiveId = userInfo.effectiveUserId;

    const { data: ultimoPedido } = await supabase
      .from('delivery_pedidos')
      .select('numero')
      .eq('user_id', effectiveId)
      .order('numero', { ascending: false })
      .limit(1)
      .single();

    const proximoNumero = (ultimoPedido?.numero || 0) + 1;

    const { data: pedido, error: pedidoError } = await supabase.from("delivery_pedidos").insert({
      user_id: effectiveId,
      numero: proximoNumero,
      cliente_id: clienteId || null,
      cliente_nome: clienteNome.trim() || "Cliente",
      cliente_telefone: telefone.trim() || null,
      endereco: endereco.trim(),
      subtotal,
      taxa_entrega: taxa,
      desconto: 0,
      total,
      forma_pagamento: formaPagamento || null,
      observacoes: observacoes.trim() || null,
      status: "pendente",
    }).select().single();

    if (pedidoError) {
      setError(`Erro ao criar pedido: ${pedidoError.message}`);
      setLoading(false);
      return;
    }

    if (!pedido) {
      setError("Erro inesperado: pedido nao foi criado.");
      setLoading(false);
      return;
    }

    const itensData = itens.map(item => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      nome_produto: item.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.preco * item.quantidade,
    }));

    const { error: itensError } = await supabase.from("delivery_itens").insert(itensData);
    
    if (itensError) {
      setError(`Pedido criado, mas erro ao salvar itens: ${itensError.message}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    resetForm();
    onSuccess();
  };

  const resetForm = () => {
    setClienteId("");
    setClienteNome("");
    setTelefone("");
    setEndereco("");
    setObservacoes("");
    setTaxaEntrega("");
    setItens([]);
    setSelectedProduto("");
    setFormaPagamento("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido Delivery</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente Cadastrado</Label>
              <Select value={clienteId} onValueChange={handleClienteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou preencha manualmente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Cliente</Label>
              <Input
                id="nome"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxa">Taxa de Entrega</Label>
              <Input
                id="taxa"
                type="number"
                step="0.01"
                min="0"
                value={taxaEntrega}
                onChange={(e) => setTaxaEntrega(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço de Entrega *</Label>
            <Textarea
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, complemento..."
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Adicionar Itens</Label>
            <div className="flex gap-2">
              <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} - {formatCurrency(produto.preco)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addItem} disabled={!selectedProduto}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {itens.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              {itens.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{item.nome}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-transparent"
                        onClick={() => updateQuantidade(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantidade}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-transparent"
                        onClick={() => updateQuantidade(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="w-24 text-right">{formatCurrency(item.preco * item.quantidade)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de Entrega:</span>
                  <span>{formatCurrency(taxa)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {formasPagamento.map((fp) => {
                const Icon = fp.icon;
                return (
                  <Button
                    key={fp.value}
                    type="button"
                    variant={formaPagamento === fp.value ? "default" : "outline"}
                    className={formaPagamento === fp.value
                      ? "bg-primary text-primary-foreground gap-2"
                      : "bg-transparent gap-2"}
                    onClick={() => setFormaPagamento(fp.value)}
                  >
                    <Icon className="h-4 w-4" />
                    {fp.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do pedido..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || itens.length === 0 || !endereco.trim()}>
              {loading ? "Salvando..." : "Criar Pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
