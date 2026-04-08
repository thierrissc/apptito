import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user: owner },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !owner) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.email || !data.senha || !data.nome) {
    return NextResponse.json(
      { error: "Email, senha e nome são obrigatórios" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.senha,
      options: {
        data: { nome: data.nome },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already") || signUpError.message.includes("exists")) {
        return NextResponse.json(
          { error: "Este e-mail já está registrado no sistema" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!signUpData.user) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("sub_contas").insert({
      user_id: signUpData.user.id,
      owner_id: owner.id,
      funcionario_id: data.funcionario_id || null,
      email: data.email,
      nome: data.nome,
      ativo: true,
      pode_editar: data.pode_editar ?? false,
      pode_ver_dashboard: data.pode_ver_dashboard ?? true,
      pode_ver_vendas: data.pode_ver_vendas ?? true,
      pode_ver_comandas: data.pode_ver_comandas ?? true,
      pode_ver_cozinha: data.pode_ver_cozinha ?? true,
      pode_ver_delivery: data.pode_ver_delivery ?? true,
      pode_ver_produtos: data.pode_ver_produtos ?? true,
      pode_ver_estoque: data.pode_ver_estoque ?? true,
      pode_ver_clientes: data.pode_ver_clientes ?? true,
      pode_ver_equipe: data.pode_ver_equipe ?? false,
      pode_ver_fornecedores: data.pode_ver_fornecedores ?? false,
      pode_ver_financeiro: data.pode_ver_financeiro ?? false,
      pode_ver_configuracoes: data.pode_ver_configuracoes ?? false,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Erro ao salvar permissões: " + insertError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, userId: signUpData.user.id });
  }

  const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.senha,
    email_confirm: true,
    user_metadata: { nome: data.nome },
  });

  if (createError) {
    if (createError.message.includes("already") || createError.message.includes("exists")) {
      return NextResponse.json(
        { error: "Este e-mail já está registrado no sistema" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  if (!newUser.user) {
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }

  const { error: insertError } = await adminClient.from("sub_contas").insert({
    user_id: newUser.user.id,
    owner_id: owner.id,
    funcionario_id: data.funcionario_id || null,
    email: data.email,
    nome: data.nome,
    ativo: true,
    pode_editar: data.pode_editar ?? false,
    pode_ver_dashboard: data.pode_ver_dashboard ?? true,
    pode_ver_vendas: data.pode_ver_vendas ?? true,
    pode_ver_comandas: data.pode_ver_comandas ?? true,
    pode_ver_cozinha: data.pode_ver_cozinha ?? true,
    pode_ver_delivery: data.pode_ver_delivery ?? true,
    pode_ver_produtos: data.pode_ver_produtos ?? true,
    pode_ver_estoque: data.pode_ver_estoque ?? true,
    pode_ver_clientes: data.pode_ver_clientes ?? true,
    pode_ver_equipe: data.pode_ver_equipe ?? false,
    pode_ver_fornecedores: data.pode_ver_fornecedores ?? false,
    pode_ver_financeiro: data.pode_ver_financeiro ?? false,
    pode_ver_configuracoes: data.pode_ver_configuracoes ?? false,
  });

  if (insertError) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json(
      { error: "Erro ao salvar permissões: " + insertError.message },
      { status: 500 }
    );
  }

  await adminClient.from("profiles").update({
    is_owner: false,
    owner_id: owner.id,
    ativo: true,
    assinatura_status: 'ativo',
  }).eq("id", newUser.user.id);

  return NextResponse.json({ success: true, userId: newUser.user.id });
}
