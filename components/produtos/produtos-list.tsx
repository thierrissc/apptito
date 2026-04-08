"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EditarProdutoDialog } from "./editar-produto-dialog";
import type { Produto, Categoria } from "@/lib/types";

interface ProdutosListProps {
  produtos: Produto[];
  categorias: Categoria[];
  loading: boolean;
  onUpdate: () => void;
}

export function ProdutosList({ produtos, categorias, loading, onUpdate }: ProdutosListProps) {
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const supabase = createClient();

  const handleToggleAtivo = async (produto: Produto) => {
    await supabase
      .from("produtos")
      .update({ ativo: !produto.ativo })
      .eq("id", produto.id);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      await supabase.from("produtos").delete().eq("id", id);
      onUpdate();
    }
  };

  const getCategoriaName = (categoriaId: string | null) => {
    if (!categoriaId) return "Sem categoria";
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria?.nome || "Sem categoria";
  };

  const calculateMargin = (produto: Produto) => {
    const custoTotal = produto.custo || 0;
    
    if (custoTotal === 0 || produto.preco === 0) {
      return { margem: 0, percentual: 0, cor: 'text-muted-foreground' };
    }

    const margem = produto.preco - custoTotal;
    const percentual = (margem / produto.preco) * 100;

    let cor = 'text-muted-foreground';
    if (percentual >= 60) cor = 'text-green-600';
    else if (percentual >= 40) cor = 'text-yellow-600';
    else if (percentual > 0) cor = 'text-orange-600';
    else cor = 'text-red-600';

    return { margem, percentual, cor };
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Nenhum produto cadastrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Categoria</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Custo</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Preço</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Margem</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-right p-4 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-b border-border last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {produto.imagem_url ? (
                      <img 
                        src={produto.imagem_url || "/placeholder.svg"} 
                        alt={produto.nome}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">IMG</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      {produto.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{produto.descricao}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">
                  {getCategoriaName(produto.categoria_id)}
                </td>
                <td className="p-4 text-muted-foreground">
                  R${(produto.custo || 0).toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4 font-medium">
                  R${produto.preco.toFixed(2).replace(".", ",")}
                </td>
                <td className="p-4">
                  {(() => {
                    const { margem, percentual, cor } = calculateMargin(produto);
                    return (
                      <div className="flex flex-col">
                        <span className={`font-medium ${cor}`}>
                          {percentual > 0 ? '+' : ''}{percentual.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          R${margem.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="p-4">
                  <Badge variant={produto.ativo ? "default" : "secondary"}>
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProduto(produto)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAtivo(produto)}>
                        {produto.ativo ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(produto.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditarProdutoDialog
        produto={editingProduto}
        categorias={categorias}
        open={!!editingProduto}
        onOpenChange={(open) => !open && setEditingProduto(null)}
        onSuccess={onUpdate}
      />
    </>
  );
}
