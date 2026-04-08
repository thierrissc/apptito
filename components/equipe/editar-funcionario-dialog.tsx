"use client";

import React from "react"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Funcionario } from "@/lib/types";

interface EditarFuncionarioDialogProps {
  funcionario: Funcionario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditarFuncionarioDialog({
  funcionario,
  open,
  onOpenChange,
  onSuccess,
}: EditarFuncionarioDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [salario, setSalario] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (funcionario) {
      setNome(funcionario.nome);
      setCargo(funcionario.cargo);
      setTelefone(funcionario.telefone || "");
      setEmail(funcionario.email || "");
      setSalario(funcionario.salario.toString());
      setDataAdmissao(funcionario.data_admissao);
    }
  }, [funcionario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcionario || !nome.trim() || !cargo.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from("funcionarios")
      .update({
        nome: nome.trim(),
        cargo: cargo.trim(),
        telefone: telefone.trim() || null,
        email: email.trim() || null,
        salario: parseFloat(salario) || 0,
        data_admissao: dataAdmissao,
      })
      .eq("id", funcionario.id);

    setLoading(false);

    if (!error) {
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Funcionário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-func-nome">Nome *</Label>
            <Input
              id="edit-func-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-func-cargo">Cargo *</Label>
            <Input
              id="edit-func-cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Garçom, Cozinheiro, Caixa"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-func-telefone">Telefone</Label>
              <Input
                id="edit-func-telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-func-salario">Salário</Label>
              <Input
                id="edit-func-salario"
                type="number"
                step="0.01"
                min="0"
                value={salario}
                onChange={(e) => setSalario(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-func-email">E-mail</Label>
            <Input
              id="edit-func-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-func-admissao">Data de Admissão</Label>
            <Input
              id="edit-func-admissao"
              type="date"
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !nome.trim() || !cargo.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
