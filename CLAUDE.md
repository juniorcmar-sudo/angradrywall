@AGENTS.md

# ERP Angra Drywall — Guia para Sessões

## Stack e versões

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Linguagem | TypeScript |
| UI | TailwindCSS + shadcn/ui (Radix UI) |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Banco | PostgreSQL via Supabase |
| Formulários | React Hook Form + Zod |
| Auth | **CUSTOM** — bcryptjs + cookie `erp_session` (NOT better-auth) |
| PDF | `@react-pdf/renderer` v4 |
| Toasts | Sonner |
| Gráficos | Recharts |

---

## Conexão com banco — CRÍTICO

- `src/lib/prisma.ts` define `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` **antes** de inicializar o adapter
- `PrismaPg` recebe `{ connectionString }` como objeto — NÃO passar instância de `pg.Pool`
- `datasource db` no schema.prisma **não tem** `url =` (Prisma v7 — URL fica em `prisma.config.ts`)
- DATABASE_URL aponta para conexão direta Supabase (não pooler): `db.uyixiqymawhomkowyjwp.supabase.co:5432`

---

## Autenticação — fluxo exato

- Login: `POST /api/login` recebe `{ password }` → verifica bcrypt → cria `Session` no DB → seta cookie `erp_session` (httpOnly, 7 dias)
- Logout: `POST /api/logout` → apaga cookie e sessão do DB
- Guard: `src/proxy.ts` (renomeado de `middleware.ts` — Next.js 16 exige o nome `proxy`)
- Paths públicos: `/login`, `/api/login`
- **Não existe** better-auth, `lib/auth.ts`, `lib/auth-client.ts` — foram removidos

---

## Tema visual

- **Sempre light mode** — sem classe `.dark` no HTML
- Sidebar: navy `hsl(220 60% 12%)`
- Primary/gold: `hsl(38 96% 47%)`
- Background: `hsl(0 0% 97%)` (off-white)
- Variáveis CSS em `src/app/globals.css`

---

## Estrutura de arquivos

```
src/
├── app/
│   ├── (dashboard)/          # Todas as páginas protegidas
│   │   ├── layout.tsx        # Sidebar wrapping
│   │   ├── dashboard/page.tsx
│   │   ├── clientes/
│   │   │   ├── page.tsx
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── produtos/
│   │   │   ├── page.tsx
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx  # Edição
│   │   ├── estoque/page.tsx
│   │   ├── orcamentos/
│   │   │   ├── page.tsx
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── vendas/page.tsx
│   │   ├── pedidos-pendentes/page.tsx
│   │   ├── fretes/page.tsx
│   │   ├── relatorios/page.tsx
│   │   └── configuracoes/page.tsx
│   ├── api/
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── login/page.tsx
│   ├── page.tsx              # redirect → /dashboard
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── header.tsx        # Header com barra gold à esquerda
│   │   └── sidebar.tsx       # Sidebar colapsível navy
│   └── ui/                   # shadcn/ui components
│       ├── badge.tsx         # Variantes: success, warning, info, gray, destructive
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx        # Tem aria-describedby={undefined} no DialogContent
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       └── textarea.tsx
├── lib/
│   └── prisma.ts             # Singleton PrismaClient com TLS bypass
├── modules/
│   ├── customers/
│   │   ├── actions.ts        # createCustomer, createCustomerQuick, updateCustomer, deleteCustomer, getCustomers, getCustomerById
│   │   ├── customer-detail.tsx
│   │   ├── customer-form.tsx # Campos: name*, phone1*, cep+ViaCEP, rua, numero, bairro, cidade, uf, razaoSocial, cpfCnpj, email, phone2, notes
│   │   └── customers-table.tsx
│   ├── dashboard/
│   │   ├── dashboard-alerts.tsx
│   │   ├── dashboard-cards.tsx
│   │   └── dashboard-charts.tsx
│   ├── freight/
│   │   ├── actions.ts        # createFreightZone, updateFreightZone, toggleFreightZone, getFreightZones
│   │   └── freight-zones-manager.tsx
│   ├── pdf/
│   │   ├── pdf-button-inner.tsx   # Importa @react-pdf diretamente (sem next/dynamic)
│   │   ├── pdf-download-button.tsx # Wrapper com next/dynamic(ssr:false)
│   │   └── quote-pdf.tsx
│   ├── pending-orders/
│   │   └── pending-orders-table.tsx
│   ├── products/
│   │   ├── actions.ts        # createProduct, updateProduct, toggleProductActive, getProducts, getCategories, getTags
│   │   ├── product-form.tsx
│   │   └── products-table.tsx
│   ├── quotes/
│   │   ├── actions.ts        # createQuote, updateQuoteStatus, duplicateQuote, getQuotes, getQuoteById
│   │   ├── quote-builder.tsx # Builder completo com busca inline de cliente
│   │   ├── quote-detail.tsx
│   │   └── quotes-table.tsx
│   ├── reports/
│   │   └── reports-view.tsx
│   ├── sales/
│   │   └── sales-table.tsx
│   ├── settings/
│   │   ├── actions.ts        # getSettings, saveSettings
│   │   └── settings-form.tsx
│   └── stock/
│       ├── actions.ts        # registerStockMovement, getStockOverview
│       ├── stock-movement-form.tsx
│       └── stock-overview.tsx
├── proxy.ts                  # Middleware guard (nome obrigatório no Next.js 16)
├── types/
│   └── index.ts              # Re-exports do Prisma + tipos compostos
└── utils/
    ├── cn.ts
    └── currency.ts           # formatCurrency, parseCurrency, PAYMENT_FEES, PAYMENT_METHOD_LABELS, calculatePriceWithFee
```

---

## Regras de negócio implementadas

### Pagamento
| Método | Chave enum | Taxa |
|---|---|---|
| Pix | PIX | 0% |
| Dinheiro | CASH | 0% |
| Débito | DEBIT | 1.99% |
| Crédito maquininha | CREDIT | 4.99% |
| Link até 12x | LINK_3X | 3.99% |

Preços base salvos: `basePriceCommon` e `basePriceDrywall`. Taxa calculada dinamicamente — nunca salva.

### Tipos de cliente
- `COMMON` — preço comum
- `DRYWALL_WORKER` — preço gesseiro (geralmente menor)

### Frete (Quote Builder)
- `NONE` — sem frete
- `PICKUP` — retirada local (mostra `companyAddress` das Settings)
- `DELIVERY` — entrega com zona (tabela `freight_zones`)

### Status do orçamento
`DRAFT` → `SENT` → `AWAITING_PAYMENT` → `PAID` → (cancelado: `CANCELLED`)

Ao marcar como `PAID`: cria Sale, baixa estoque, cria PendingOrder se estoque insuficiente.

---

## Quote Builder — comportamento atual

- Busca de cliente: client-side por nome, telefone, razão social, CPF/CNPJ
- Form inline de novo cliente: usa `createCustomerQuick` → auto-seleciona
- ViaCEP: `https://viacep.com.br/ws/{8digits}/json/` auto-preenche rua/bairro/cidade/uf
- PIX e Dinheiro: cards grandes com badge "Melhor valor" e "A partir de R$ X à vista"
- Débito, Crédito, Link: botões menores abaixo
- Props necessárias: `customers`, `products`, `freightZones`, `companyAddress?`
- `companyAddress` vem de `getSettings()` na página `orcamentos/novo/page.tsx`

---

## PDF

Padrão de dois arquivos para evitar erro "su is not a function" do @react-pdf:
1. `pdf-button-inner.tsx` — importa `PDFDownloadLink` e `QuotePDF` diretamente
2. `pdf-download-button.tsx` — usa `next/dynamic(ssr: false)` para importar o inner

**Nunca** passar componente wrapped por `next/dynamic` como prop `document` do react-pdf.

---

## Armadilhas conhecidas

| Problema | Solução |
|---|---|
| `SelectItem value=""` causa erro Radix | Usar `value="none"` e tratar no `onValueChange` |
| Dashboard: comparar `stock <= minimumStock` | Usar `$queryRaw` — Prisma não suporta comparação entre colunas |
| `PrismaPg` com instância de Pool falha no Turbopack | Passar `{ connectionString }` diretamente |
| react-pdf + next/dynamic | Separar em dois arquivos (ver seção PDF) |
| `middleware.ts` não funciona no Next.js 16 | Usar `proxy.ts` com função exportada como `proxy` |
| `DialogContent` sem `aria-describedby` gera warning Radix | Já tem `aria-describedby={undefined}` no componente base |

---

## Movimentações de estoque

Tipos implementados (enum `StockMovementType`):
- Entradas: `ENTRY_MANUAL`, `ENTRY_SUPPLIER`, `ENTRY_PURCHASE`, `ENTRY_RESTOCK`
- Saídas: `EXIT_SALE` (automático), `EXIT_LOSS`, `EXIT_DAMAGE`, `EXIT_BREAK`
- Ajuste: `ADJUSTMENT`

Cores no histórico: verde=entrada, azul=venda, amarelo=ajuste, vermelho=perda/avaria/quebra

---

## Próximas features a implementar

- Criação inline de categoria/tag no formulário de produto (`createCategory`/`createTag` foram removidos — recriar quando houver UI)
- Edição de orçamento (atualmente só criação — não há `updateQuote`)
- Orçamento editável via página `/orcamentos/[id]` (hoje só muda status)
- Timeline de eventos por entidade
- Exportação de relatórios (CSV/Excel)
- Integração WhatsApp (copiar mensagem + abrir link)
