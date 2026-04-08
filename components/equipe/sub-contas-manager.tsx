"use client";

import React from "react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserPlus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Mail,
  Key,
  User,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SubConta, Funcionario } from "@/lib/types";
import {
  createSubConta,
  updateSubConta,
  deleteSubConta as deleteSubContaAction,
  toggleSubContaStatus,
} from "@/lib/actions/sub-contas-actions";

interface SubContasManagerProps {
  funcionarios: Funcionario[];
}

const PERMISSOES_LABELS: { key: keyof SubConta; label: string; icon: string }[] = [
  { key: "pode_ver_dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "pode_ver_vendas", label: "Vendas/Caixa", icon: "sales" },
  { key: "pode_ver_comandas", label: "Comandas", icon: "orders" },
  { key: "pode_ver_cozinha", label: "Cozinha", icon: "kitchen" },
  { key: "pode_ver_delivery", label: "Delivery", icon: "delivery" },
  { key: "pode_ver_produtos", label: "Produtos", icon: "products" },
  { key: "pode_ver_estoque", label: "Estoque", icon: "stock" },
  { key: "pode_ver_clientes", label: "Clientes", icon: "clients" },
  { key: "pode_ver_equipe", label: "Equipe", icon: "team" },
  { key: "pode_ver_fornecedores", label: "Fornecedores", icon: "suppliers" },
  { key: "pode_ver_financeiro", label: "Financeiro", icon: "finance" },
  { key: "pode_ver_configuracoes", label: "Configurações", icon: "settings" },
];

export function SubContasManager({ funcionarios }: SubContasManagerProps) {
  const [subContas, setSubContas] = useState<SubConta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSubConta, setEditingSubConta] = useState<SubConta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: "",
    funcionario_id: "",
    pode_editar: false,
    pode_ver_dashboard: true,
    pode_ver_vendas: true,
    pode_ver_comandas: true,
    pode_ver_cozinha: true,
    pode_ver_delivery: true,
    pode_ver_produtos: true,
    pode_ver_estoque: true,
    pode_ver_clientes: true,
    pode_ver_equipe: false,
    pode_ver_fornecedores: false,
    pode_ver_financeiro: false,
    pode_ver_configuracoes: false,
  });

  const supabase = createClient();

  const fetchSubContas = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("sub_contas")
      .select("*, funcionario:funcionarios(nome)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setSubContas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubContas();
  }, []);

  const resetForm = () => {
    setFormData({
      email: "",
      senha: "",
      nome: "",
      funcionario_id: "",
      pode_editar: false,
      pode_ver_dashboard: true,
      pode_ver_vendas: true,
      pode_ver_comandas: true,
      pode_ver_cozinha: true,
      pode_ver_delivery: true,
      pode_ver_produtos: true,
      pode_ver_estoque: true,
      pode_ver_clientes: true,
      pode_ver_equipe: false,
      pode_ver_fornecedores: false,
      pode_ver_financeiro: false,
      pode_ver_configuracoes: false,
    });
    setEditingSubConta(null);
    setError(null);
    setShowPassword(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (subConta: SubConta) => {
    setEditingSubConta(subConta);
    setFormData({
      email: subConta.email,
      senha: "",
      nome: subConta.nome,
      funcionario_id: subConta.funcionario_id || "",
      pode_editar: subConta.pode_editar,
      pode_ver_dashboard: subConta.pode_ver_dashboard,
      pode_ver_vendas: subConta.pode_ver_vendas,
      pode_ver_comandas: subConta.pode_ver_comandas,
      pode_ver_cozinha: subConta.pode_ver_cozinha,
      pode_ver_delivery: subConta.pode_ver_delivery,
      pode_ver_produtos: subConta.pode_ver_produtos,
      pode_ver_estoque: subConta.pode_ver_estoque,
      pode_ver_clientes: subConta.pode_ver_clientes,
      pode_ver_equipe: subConta.pode_ver_equipe,
      pode_ver_fornecedores: subConta.pode_ver_fornecedores,
      pode_ver_financeiro: subConta.pode_ver_financeiro,
      pode_ver_configuracoes: subConta.pode_ver_configuracoes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (editingSubConta) {
        const result = await updateSubConta({
          id: editingSubConta.id,
          nome: formData.nome,
          funcionario_id: formData.funcionario_id === "none" ? null : formData.funcionario_id || null,
          pode_editar: formData.pode_editar,
          pode_ver_dashboard: formData.pode_ver_dashboard,
          pode_ver_vendas: formData.pode_ver_vendas,
          pode_ver_comandas: formData.pode_ver_comandas,
          pode_ver_cozinha: formData.pode_ver_cozinha,
          pode_ver_delivery: formData.pode_ver_delivery,
          pode_ver_produtos: formData.pode_ver_produtos,
          pode_ver_estoque: formData.pode_ver_estoque,
          pode_ver_clientes: formData.pode_ver_clientes,
          pode_ver_equipe: formData.pode_ver_equipe,
          pode_ver_fornecedores: formData.pode_ver_fornecedores,
          pode_ver_financeiro: formData.pode_ver_financeiro,
          pode_ver_configuracoes: formData.pode_ver_configuracoes,
        });

        if (result.error) {
          setError(result.error);
          setFormLoading(false);
          return;
        }
      } else {
        const result = await createSubConta({
          email: formData.email,
          senha: formData.senha,
          nome: formData.nome,
          funcionario_id: formData.funcionario_id === "none" ? null : formData.funcionario_id || null,
          pode_editar: formData.pode_editar,
          pode_ver_dashboard: formData.pode_ver_dashboard,
          pode_ver_vendas: formData.pode_ver_vendas,
          pode_ver_comandas: formData.pode_ver_comandas,
          pode_ver_cozinha: formData.pode_ver_cozinha,
          pode_ver_delivery: formData.pode_ver_delivery,
          pode_ver_produtos: formData.pode_ver_produtos,
          pode_ver_estoque: formData.pode_ver_estoque,
          pode_ver_clientes: formData.pode_ver_clientes,
          pode_ver_equipe: formData.pode_ver_equipe,
          pode_ver_fornecedores: formData.pode_ver_fornecedores,
          pode_ver_financeiro: formData.pode_ver_financeiro,
          pode_ver_configuracoes: formData.pode_ver_configuracoes,
        });

        if (result.error) {
          setError(result.error);
          setFormLoading(false);
          return;
        }
      }

      setDialogOpen(false);
      resetForm();
      fetchSubContas();
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao salvar. Tente novamente.");
    }

    setFormLoading(false);
  };

  const handleToggleActive = async (subConta: SubConta) => {
    const result = await toggleSubContaStatus(subConta.id, !subConta.ativo);
    if (!result.error) fetchSubContas();
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const result = await deleteSubContaAction(deletingId);
    
    if (!result.error) {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchSubContas();
    }
  };

  const countPermissions = (subConta: SubConta) => {
    return PERMISSOES_LABELS.filter(p => subConta[p.key as keyof SubConta] === true).length;
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Logins de Funcionários</h3>
          <p className="text-sm text-muted-foreground">
            Crie acessos para sua equipe com permissões personalizadas
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Criar Acesso
        </Button>
      </div>

      {subContas.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum acesso criado
            </h3>
            <p className="text-muted-foreground mb-4">
              Crie logins para seus funcionários acessarem o sistema com permissões limitadas
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Criar Primeiro Acesso
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subContas.map((subConta) => (
            <Card key={subConta.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    subConta.ativo ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <User className={`h-5 w-5 ${
                      subConta.ativo ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{subConta.nome}</h4>
                      <Badge 
                        variant={subConta.ativo ? "default" : "secondary"}
                        className={subConta.ativo ? "bg-success text-success-foreground" : ""}
                      >
                        {subConta.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      {subConta.pode_editar && (
                        <Badge variant="outline" className="gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Pode Editar
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{subConta.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {countPermissions(subConta)} abas liberadas
                      {subConta.funcionario && ` • Vinculado a: ${subConta.funcionario.nome}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={subConta.ativo}
                    onCheckedChange={() => handleToggleActive(subConta)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(subConta)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Permissões
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setDeletingId(subConta.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Acesso
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubConta ? "Editar Acesso" : "Criar Novo Acesso"}
            </DialogTitle>
            <DialogDescription>
              {editingSubConta 
                ? "Atualize as permissões deste acesso"
                : "Crie um login para um funcionário acessar o sistema"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Dados de Acesso
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Funcionário *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail de Acesso *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="funcionario@email.com"
                  required
                  disabled={!!editingSubConta}
                />
              </div>

              {!editingSubConta && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="funcionario">Vincular a Funcionário (opcional)</Label>
                <Select
                  value={formData.funcionario_id}
                  onValueChange={(value) => setFormData({ ...formData, funcionario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {funcionarios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome} - {f.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Permissão de Edição
              </h4>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="font-medium text-foreground">Pode editar dados</p>
                  <p className="text-sm text-muted-foreground">
                    Se desativado, funcionário só poderá visualizar
                  </p>
                </div>
                <Switch
                  checked={formData.pode_editar}
                  onCheckedChange={(checked) => setFormData({ ...formData, pode_editar: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Key className="h-4 w-4" />
                Abas Visíveis
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                {PERMISSOES_LABELS.map((perm) => (
                  <div 
                    key={perm.key}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <span className="text-sm text-foreground">{perm.label}</span>
                    <Switch
                      checked={formData[perm.key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, [perm.key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Salvando..." : editingSubConta ? "Salvar Alterações" : "Criar Acesso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover o acesso do funcionário ao sistema. 
              Ele não poderá mais fazer login com este e-mail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
