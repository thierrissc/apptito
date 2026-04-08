<div align="center">

## Apptito

**Sistema de gestão para restaurantes e estabelecimentos alimentícios.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>


## Sobre

Plataforma SaaS que centraliza as operações do dia a dia de um restaurante: comandas, delivery, caixa, financeiro, estoque, produtos, clientes, equipe e fornecedores. Cada estabelecimento tem dados completamente isolados por Row Level Security no Supabase. O sistema suporta sub-contas de funcionários com permissões granulares por módulo, o proprietário define exatamente quais telas cada membro da equipe pode acessar e editar.



## Módulos

| Módulo | Descrição |
|---|---|
| Dashboard | Visão geral com faturamento do dia, comandas abertas, alertas de estoque baixo e produtos mais vendidos |
| Comandas | Gestão de mesas com abertura de comandas, adição de itens, descontos, taxa de serviço e fechamento com múltiplas formas de pagamento, atualizado em tempo real |
| Cozinha (KDS) | Painel para a equipe de cozinha com rastreamento de status por item: pendente, preparando, pronto e entregue |
| Delivery | Fluxo completo de pedidos de entrega com status, atribuição de entregador, taxa de entrega e troco |
| Vendas / Caixa | Abertura e fechamento de caixa, registro de vendas no balcão, sangria, suprimento e emissão de cupom para impressora térmica |
| Financeiro | Lançamento de transações, categorias customizáveis, indicadores de CMV e margem, e DRE simplificado |
| Estoque | Cadastro de insumos com quantidade mínima, custo, validade e movimentações de entrada, saída e ajuste |
| Produtos | Cardápio com categorias ordenáveis, imagem, preço de venda, preço de custo e controle de disponibilidade |
| Clientes | Cadastro completo com endereço, CPF, histórico de compras e total gasto |
| Equipe | Funcionários com cargo, salário, dados bancários, registro de ponto e criação de sub-contas de acesso |
| Fornecedores | Cadastro de fornecedores vinculado a compras de estoque |
| Configurações | Dados do restaurante, logo, perfil do usuário e gerenciamento de sub-contas |



## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Estilização | Tailwind CSS 4, Radix UI, shadcn/ui, Lucide React |
| Backend / BaaS | Supabase - PostgreSQL, Auth, Realtime, Storage |
| Formulários | React Hook Form, Zod |
| Gráficos | Recharts |
| Utilitários | date-fns, Sonner, Vercel Analytics |


## Instalação

**Pré-requisitos:** Node.js 18+, conta no [Supabase](https://supabase.com)

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd apptito

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env.local na raiz com o conteúdo abaixo:
# NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>

# 4. Configure o banco de dados
# Execute os arquivos em scripts/ no painel SQL do Supabase, na ordem numérica (01 ao 13)

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

Para build de produção:

```bash
npm run build
npm start
```



## Estrutura de Pastas

```
apptito/
├── app/                  # Rotas e páginas (App Router)
│   ├── auth/             # Login, cadastro e acesso expirado
│   └── dashboard/        # Área autenticada com todos os módulos
├── components/           # Componentes React por módulo
│   └── ui/               # Componentes base (shadcn/ui)
├── contexts/             # PermissionsContext global
├── hooks/                # use-permissions, use-toast, use-mobile
├── lib/
│   ├── supabase/         # Clientes server, client e proxy SSR
│   ├── actions/          # Server Actions
│   ├── types.ts          # Tipagens globais
│   ├── access-utils.ts   # Lógica de dias de acesso
│   └── print-utils.ts    # Utilitário de impressão térmica
└── scripts/              # Migrations SQL numeradas
```


#
<div align="center">
Projeto privado. Todos os direitos reservados.
</div>
