"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Package, Upload, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Categoria, Estoque } from "@/lib/types";

interface Ingrediente {
  estoqueId: string;
  quantidade: number;
  unidade: string;
}

interface CadastrarProdutoButtonProps {
  categorias: Categoria[];
  onSuccess: () => void;
}

export function CadastrarProdutoButton({ categorias, onSuccess }: CadastrarProdutoButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [tempoPreparo, setTempoPreparo] = useState("15");
  const [estoqueItens, setEstoqueItens] = useState<Estoque[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [novoIngredienteId, setNovoIngredienteId] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaUnidade, setNovaUnidade] = useState("g");

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      carregarEstoque();
    }
  }, [open]);

  const carregarEstoque = async () => {
    const { data } = await supabase
      .from("estoque")
      .select("*")
      .order("nome");
    
    if (data) {
      setEstoqueItens(data);
    }
  };

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

  const adicionarIngrediente = () => {
    if (!novoIngredienteId || !novaQuantidade) return;

    const jaExiste = ingredientes.some(i => i.estoqueId === novoIngredienteId);
    if (jaExiste) return;

    setIngredientes([
      ...ingredientes,
      {
        estoqueId: novoIngredienteId,
        quantidade: parseFloat(novaQuantidade),
        unidade: novaUnidade,
      }
    ]);

    setNovoIngredienteId("");
    setNovaQuantidade("");
    setNovaUnidade("g");
  };

  const removerIngrediente = (estoqueId: string) => {
    setIngredientes(ingredientes.filter(i => i.estoqueId !== estoqueId));
  };

  const getEstoqueNome = (estoqueId: string) => {
    return estoqueItens.find(e => e.id === estoqueId)?.nome || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !preco) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: produto, error } = await supabase
      .from("produtos")
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        preco: parseFloat(preco),
        categoria_id: categoriaId || null,
        imagem_url: imagemUrl.trim() || null,
        disponivel: ativo,
        tempo_preparo: parseInt(tempoPreparo) || 15,
      })
      .select()
      .single();

    if (error || !produto) {
      setLoading(false);
      return;
    }
    if (ingredientes.length > 0) {
      const ingredientesData = ingredientes.map(ing => ({
        produto_id: produto.id,
        estoque_id: ing.estoqueId,
        quantidade: ing.quantidade,
        unidade: ing.unidade,
      }));

      await supabase.from("produto_ingredientes").insert(ingredientesData);
    }

    setLoading(false);
    setOpen(false);
    resetForm();
    onSuccess();
  };

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setPreco("");
    setCategoriaId("");
    setImagemUrl("");
    setImagemPreview(null);
    setAtivo(true);
    setTempoPreparo("15");
    setIngredientes([]);
    setNovoIngredienteId("");
    setNovaQuantidade("");
    setNovaUnidade("g");
  };

  const unidades = ["g", "kg", "ml", "l", "un"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Produto</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informacoes</TabsTrigger>
            <TabsTrigger value="ingredientes">
              <Package className="h-4 w-4 mr-2" />
              Ingredientes ({ingredientes.length})
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do produto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descricao</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descricao do produto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preco *</Label>
                  <Input
                    id="preco"
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
                  <Label htmlFor="categoria">Categoria</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="tempo">Tempo Preparo (min)</Label>
                  <Input
                    id="tempo"
                    type="number"
                    min="1"
                    value={tempoPreparo}
                    onChange={(e) => setTempoPreparo(e.target.value)}
                    placeholder="15"
                  />
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
                    id="imagem-upload"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imagem-upload')?.click()}
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
                <Label htmlFor="ativo">Produto Ativo</Label>
                <Switch
                  id="ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                />
              </div>
            </TabsContent>

            <TabsContent value="ingredientes" className="space-y-4 pt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Cadastre os ingredientes do estoque necessarios para preparar este prato.
                O estoque sera abatido automaticamente quando o prato for preparado.
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-4 gap-2 items-end">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Item do Estoque</Label>
                      <Select value={novoIngredienteId} onValueChange={setNovoIngredienteId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {estoqueItens.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nome} ({item.quantidade}{item.unidade})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={novaQuantidade}
                        onChange={(e) => setNovaQuantidade(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Unidade</Label>
                      <div className="flex gap-1">
                        <Select value={novaUnidade} onValueChange={setNovaUnidade}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          size="icon"
                          onClick={adicionarIngrediente}
                          disabled={!novoIngredienteId || !novaQuantidade}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {ingredientes.length > 0 ? (
                <div className="space-y-2">
                  {ingredientes.map((ing) => (
                    <div 
                      key={ing.estoqueId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{getEstoqueNome(ing.estoqueId)}</span>
                        <span className="text-muted-foreground ml-2">
                          {ing.quantidade}{ing.unidade}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removerIngrediente(ing.estoqueId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum ingrediente adicionado.
                  <br />
                  <span className="text-xs">
                    Adicione itens do estoque para criar a ficha tecnica do prato.
                  </span>
                </div>
              )}
            </TabsContent>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !nome.trim() || !preco}>
                {loading ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
