"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Categoria } from "@/lib/types";

interface CategoriasListProps {
  categorias: Categoria[];
  loading: boolean;
  onUpdate: () => void;
}

export function CategoriasList({ categorias, loading, onUpdate }: CategoriasListProps) {
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setNome(categoria.nome);
    setDescricao(categoria.descricao || "");
  };

  const handleSave = async () => {
    if (!editingCategoria || !nome.trim()) return;

    setSaving(true);
    await supabase
      .from("categorias")
      .update({ nome: nome.trim(), descricao: descricao.trim() || null })
      .eq("id", editingCategoria.id);

    setSaving(false);
    setEditingCategoria(null);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta categoria? Os produtos vinculados ficarão sem categoria.")) {
      await supabase.from("categorias").delete().eq("id", id);
      onUpdate();
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Carregando categorias...</p>
      </div>
    );
  }

  if (categorias.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="bg-card rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{categoria.nome}</h3>
                {categoria.descricao && (
                  <p className="text-sm text-muted-foreground mt-1">{categoria.descricao}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(categoria)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(categoria.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingCategoria} onOpenChange={(open) => !open && setEditingCategoria(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição da categoria"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingCategoria(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !nome.trim()}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
