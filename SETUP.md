# ERP Angra Drywall — Setup

## 1. Configurar Banco de Dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **Settings > Database** e copie a **Connection String** (URI format)
3. Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:[SUA-SENHA]@db.[SEU-REF].supabase.co:5432/postgres"
BETTER_AUTH_SECRET="gere-com-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 2. Gerar o Prisma Client e aplicar o schema

```bash
npm run db:generate   # Gera o client TypeScript
npm run db:push       # Aplica o schema no banco
npm run db:seed       # Popula dados iniciais
```

## 3. Iniciar o servidor

```bash
npm run dev
```

## 4. Acessar

- URL: http://localhost:3000
- Email: `admin@angradrywall.com`
- Senha: `admin123`

## Credenciais padrão

| Campo  | Valor                     |
|--------|---------------------------|
| Email  | admin@angradrywall.com    |
| Senha  | admin123                  |

> ⚠️ **Altere a senha após o primeiro login!**

## Estrutura do projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Rotas protegidas (sidebar)
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── clientes/       # CRUD de clientes
│   │   ├── produtos/       # CRUD de produtos
│   │   ├── estoque/        # Controle de estoque
│   │   ├── orcamentos/     # Orçamentos completos
│   │   ├── vendas/         # Histórico de vendas
│   │   ├── pedidos-pendentes/
│   │   ├── fretes/         # Zonas de frete
│   │   ├── relatorios/     # Relatórios e gráficos
│   │   └── configuracoes/  # Configurações do sistema
│   ├── login/              # Página de login
│   └── api/auth/           # Better Auth handler
├── components/
│   ├── ui/                 # Componentes base (shadcn-style)
│   └── layout/             # Sidebar e Header
├── modules/                # Lógica de negócio por módulo
│   ├── customers/          # Clientes
│   ├── products/           # Produtos
│   ├── stock/              # Estoque
│   ├── quotes/             # Orçamentos
│   ├── sales/              # Vendas
│   ├── pending-orders/     # Pedidos pendentes
│   ├── freight/            # Fretes
│   ├── pdf/                # Geração de PDF
│   ├── reports/            # Relatórios
│   ├── settings/           # Configurações
│   └── dashboard/          # Dashboard
├── lib/                    # Instâncias (Prisma, Auth)
├── types/                  # TypeScript types
└── utils/                  # Utilitários (moeda, cn)
prisma/
├── schema.prisma           # Schema completo do banco
└── seed.ts                 # Dados iniciais
```

## Fluxo de orçamento

1. **Novo orçamento** → selecionar cliente → adicionar produtos → escolher pagamento → frete → criar
2. **Orçamento criado** (status: Rascunho) → copiar mensagem WhatsApp → enviar PDF
3. **Marcar como Enviado** → cliente aprova → **Aguardando Pagamento**
4. **Confirmar Pagamento** → venda registrada automaticamente → estoque baixado
5. Se produto sem estoque → **Pedido Pendente** criado automaticamente

## Regras de preço

- O sistema salva apenas `base_price_common` e `base_price_drywall`
- Preços são calculados dinamicamente com as taxas:
  - Pix / Dinheiro: sem taxa
  - Débito: +1.99%
  - Crédito: +4.99%
  - Link até 3x: +12.71%
