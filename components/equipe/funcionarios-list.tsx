"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MoreHorizontal, Pencil, Trash2, UserCheck, UserX, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditarFuncionarioDialog } from "./editar-funcionario-dialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Funcionario } from "@/lib/types";

interface FuncionariosListProps {
  funcionarios: Funcionario[];
  loading: boolean;
  onUpdate: () => void;
}

export function FuncionariosList({ funcionarios, loading, onUpdate }: FuncionariosListProps) {
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const supabase = createClient();

  const handleToggleAtivo = async (funcionario: Funcionario) => {
    await supabase
      .from("funcionarios")
      .update({ ativo: !funcionario.ativo })
      .eq("id", funcionario.id);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este funcionário?")) {
      await supabase.from("funcionarios").delete().eq("id", id);
      onUpdate();
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Carregando funcionários...</p>
      </div>
    );
  }

  if (funcionarios.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funcionarios.map((funcionario) => (
          <div key={funcionario.id} className="bg-card rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(funcionario.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{funcionario.nome}</h3>
                  <p className="text-sm text-muted-foreground">{funcionario.cargo}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingFuncionario(funcionario)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleAtivo(funcionario)}>
                    {funcionario.ativo ? (
                      <>
                        <UserX className="h-4 w-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(funcionario.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2 text-sm">
              {funcionario.telefone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{funcionario.telefone}</span>
                </div>
              )}
              {funcionario.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{funcionario.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Salário</p>
                <p className="font-semibold">{formatCurrency(funcionario.salario)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Data Admissão</p>
                <p className="font-semibold">{formatDate(funcionario.data_admissao)}</p>
              </div>
              <Badge variant={funcionario.ativo ? "default" : "secondary"}>
                {funcionario.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <EditarFuncionarioDialog
        funcionario={editingFuncionario}
        open={!!editingFuncionario}
        onOpenChange={(open) => !open && setEditingFuncionario(null)}
        onSuccess={onUpdate}
      />
    </>
  );
}
