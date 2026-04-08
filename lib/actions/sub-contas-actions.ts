"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

interface CreateSubContaData {
  email: string;
  senha: string;
  nome: string;
  funcionario_id: string | null;
  pode_editar: boolean;
  pode_ver_dashboard: boolean;
  pode_ver_vendas: boolean;
  pode_ver_comandas: boolean;
  pode_ver_cozinha: boolean;
  pode_ver_delivery: boolean;
  pode_ver_produtos: boolean;
  pode_ver_estoque: boolean;
  pode_ver_clientes: boolean;
  pode_ver_equipe: boolean;
  pode_ver_fornecedores: boolean;
  pode_ver_financeiro: boolean;
  pode_ver_configuracoes: boolean;
}

export async function createSubConta(data: CreateSubContaData) {
  const supabase = await createClient();

  const {
    data: { user: owner },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !owner) {
    return { error: "Usuário não autenticado" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return { error: "Configuração do servidor incompleta. Entre em contato com o suporte." };
  }

  const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.senha,
    email_confirm: true,
    user_metadata: {
      nome: data.nome,
    },
  });

  if (createError) {
    const errorMessage = createError.message?.toLowerCase() || "";
    const errorCode = (createError as { code?: string }).code?.toLowerCase() || "";
    
    if (
      errorMessage.includes("already") || 
      errorMessage.includes("exists") ||
      errorCode.includes("email_exists") ||
      errorCode.includes("duplicate")
    ) {
      return { error: "Este e-mail já está registrado no sistema. Use outro e-mail." };
    }
    return { error: createError.message };
  }

  if (!newUser.user) {
    return { error: "Erro ao criar usuário" };
  }

  const { error: insertError } = await adminClient.from("sub_contas").insert({
    user_id: newUser.user.id,
    owner_id: owner.id,
    funcionario_id: data.funcionario_id || null,
    email: data.email,
    nome: data.nome,
    ativo: true,
    pode_editar: data.pode_editar,
    pode_ver_dashboard: data.pode_ver_dashboard,
    pode_ver_vendas: data.pode_ver_vendas,
    pode_ver_comandas: data.pode_ver_comandas,
    pode_ver_cozinha: data.pode_ver_cozinha,
    pode_ver_delivery: data.pode_ver_delivery,
    pode_ver_produtos: data.pode_ver_produtos,
    pode_ver_estoque: data.pode_ver_estoque,
    pode_ver_clientes: data.pode_ver_clientes,
    pode_ver_equipe: data.pode_ver_equipe,
    pode_ver_fornecedores: data.pode_ver_fornecedores,
    pode_ver_financeiro: data.pode_ver_financeiro,
    pode_ver_configuracoes: data.pode_ver_configuracoes,
  });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return { error: "Erro ao salvar permissões: " + insertError.message };
  }

  await adminClient.from("profiles").update({
    is_owner: false,
    owner_id: owner.id,
    ativo: true,
    assinatura_status: 'ativo',
  }).eq("id", newUser.user.id);

  return { success: true, userId: newUser.user.id };
}

interface UpdateSubContaData {
  id: string;
  nome: string;
  funcionario_id: string | null;
  pode_editar: boolean;
  pode_ver_dashboard: boolean;
  pode_ver_vendas: boolean;
  pode_ver_comandas: boolean;
  pode_ver_cozinha: boolean;
  pode_ver_delivery: boolean;
  pode_ver_produtos: boolean;
  pode_ver_estoque: boolean;
  pode_ver_clientes: boolean;
  pode_ver_equipe: boolean;
  pode_ver_fornecedores: boolean;
  pode_ver_financeiro: boolean;
  pode_ver_configuracoes: boolean;
}

export async function updateSubConta(data: UpdateSubContaData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { error: updateError } = await supabase
    .from("sub_contas")
    .update({
      nome: data.nome,
      funcionario_id: data.funcionario_id,
      pode_editar: data.pode_editar,
      pode_ver_dashboard: data.pode_ver_dashboard,
      pode_ver_vendas: data.pode_ver_vendas,
      pode_ver_comandas: data.pode_ver_comandas,
      pode_ver_cozinha: data.pode_ver_cozinha,
      pode_ver_delivery: data.pode_ver_delivery,
      pode_ver_produtos: data.pode_ver_produtos,
      pode_ver_estoque: data.pode_ver_estoque,
      pode_ver_clientes: data.pode_ver_clientes,
      pode_ver_equipe: data.pode_ver_equipe,
      pode_ver_fornecedores: data.pode_ver_fornecedores,
      pode_ver_financeiro: data.pode_ver_financeiro,
      pode_ver_configuracoes: data.pode_ver_configuracoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .eq("owner_id", user.id);

  if (updateError) {
    return { error: "Erro ao atualizar: " + updateError.message };
  }

  return { success: true };
}

export async function deleteSubConta(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: subConta } = await supabase
    .from("sub_contas")
    .select("user_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!subConta) {
    return { error: "Sub-conta não encontrada" };
  }

  const { error: deleteError } = await supabase
    .from("sub_contas")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (deleteError) {
    return { error: "Erro ao remover: " + deleteError.message };
  }

  return { success: true };
}

export async function toggleSubContaStatus(id: string, ativo: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: subConta } = await supabase
    .from("sub_contas")
    .select("user_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!subConta) {
    return { error: "Sub-conta não encontrada" };
  }

  const { error } = await supabase
    .from("sub_contas")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    return { error: "Erro ao atualizar status: " + error.message };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseServiceKey) {
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await adminClient.from("profiles").update({ ativo }).eq("id", subConta.user_id);
  }

  return { success: true };
}
