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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";
import type { Produto, Categoria } from "@/lib/types";

interface EditarProdutoDialogProps {
  produto: Produto | null;
  categorias: Categoria[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditarProdutoDialog({
  produto,
  categorias,
  open,
  onOpenChange,
  onSuccess,
}: EditarProdutoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (produto) {
      setNome(produto.nome);
      setDescricao(produto.descricao || "");
      setPreco(produto.preco.toString());
      setCategoriaId(produto.categoria_id || "");
      setImagemUrl(produto.imagem_url || "");
      setImagemPreview(produto.imagem_url || null);
      setAtivo(produto.ativo);
    }
  }, [produto]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFazendoUpload(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFazendoUpload(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, file);

      if (uploadError) {
        setFazendoUpload(false);
        return;
      }

      const { data } = supabase.storage
        .from('produtos')
        .getPublicUrl(fileName);

      setImagemUrl(data.publicUrl);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }

    setFazendoUpload(false);
  };

  const removerImagem = () => {
    setImagemUrl("");
    setImagemPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto || !nome.trim() || !preco) return;

    setLoading(true);

    const { error } = await supabase
      .from("produtos")
      .update({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        preco: parseFloat(preco),
        categoria_id: categoriaId || null,
        imagem_url: imagemUrl.trim() || null,
        ativo,
      })
      .eq("id", produto.id);

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
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome *</Label>
            <Input
              id="edit-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do produto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea
              id="edit-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do produto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-preco">Preço *</Label>
              <Input
                id="edit-preco"
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categoria">Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={fazendoUpload}
                id="edit-imagem-upload"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('edit-imagem-upload')?.click()}
                disabled={fazendoUpload}
              >
                <Upload className="h-4 w-4 mr-2" />
                {fazendoUpload ? 'Enviando...' : 'Fazer Upload'}
              </Button>
              {imagemUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removerImagem}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {imagemPreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                <img 
                  src={imagemPreview || "/placeholder.svg"} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="edit-ativo">Produto Ativo</Label>
            <Switch
              id="edit-ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !nome.trim() || !preco}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
