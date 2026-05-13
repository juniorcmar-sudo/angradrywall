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
| Método | Chave enum | Taxa | Comportamento |
|---|---|---|---|
| Pix | PIX | 0% | Sem taxa |
| Dinheiro | CASH | 0% | Sem taxa |
| Débito | DEBIT | settings.debitFeePercent (~1.99%) | Taxa automática |
| Link de Pagamento | LINK_3X | settings.installmentFeePercent (~12.71%) | Taxa automática, parcelas auto-calculadas |
| Crédito (Maquininha) | CREDIT | Nenhuma | Parcelas manuais — valor exato salvo em `QuoteCreditInstallment` |

> **CRÍTICO:** CREDIT e LINK_3X são fluxos completamente diferentes.
> - LINK_3X: aplica % fee sobre o subtotal base; parcela = finalTotal / N
> - CREDIT: sem fee; valor total = installmentValue × installments (exato, informado manualmente)
> - CREDIT NÃO aparece como card no quote-builder — tem painel próprio "Crédito / Maquininha"
> - Ao confirmar pagamento: `confirmPayment("CREDIT", ci.installments, ciValue)` — NUNCA usar "LINK_3X" para crédito

### QuoteCreditInstallment
- Tabela: `quote_credit_installments`
- Campos: `id`, `quoteId`, `installments: Int`, `value: Decimal` (por parcela), `sortOrder: Int`
- Sempre salvos junto ao orçamento, independente do paymentMethod
- Aparecem no PDF como seção "Crédito (Maquininha)"

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
  - Campos obrigatórios: nome, tipo, telefone 1
  - Campos opcionais: telefone 2, razão social, CPF/CNPJ, email, endereço completo, observações
  - Layout: header fixo + campos com scroll (max-h-420px) + botão salvar fixo no rodapé
- ViaCEP: `https://viacep.com.br/ws/{8digits}/json/` auto-preenche rua/bairro/cidade/uf
- PIX e Dinheiro: cards grandes com badge "Melhor valor"
- Débito e Link de Pagamento: botões menores — CREDIT não aparece nos cards
- Painel "Crédito / Maquininha": sempre visível, adicionar parcelas manuais (installments + value)
- Props necessárias: `customers`, `products`, `freightZones`, `companyAddress?`, `debitFeePercent?`, `linkFeePercent?`
- `companyAddress`, `debitFeePercent`, `linkFeePercent` vêm de `getSettings()` na página

## Quote Detail — comportamento atual

- Botão "Confirmar Pago": DropdownMenu (não modal) com opções calculadas dinamicamente
  - PIX / Dinheiro: valor base
  - Débito: base × (1 + debitFee%)
  - Link de Pagamento: à vista / 2x / 3x / 4x / 5x / 6x (base × (1 + linkFee%))
  - Crédito (Maquininha): aparece apenas se `quote.creditInstallments.length > 0`; usa valor exato × parcelas
- Botão "Alterar" método de pagamento: só aparece se `quote.paymentMethod` já está definido

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
| `z.coerce.number()` com null/undefined | Coerce converte null→0, quebra `.min(1)`. Usar `z.number()` + `{ valueAsNumber: true }` |
| Input numérico retorna string para Zod | Adicionar `{ valueAsNumber: true }` no `register()` do react-hook-form |
| Turbopack cacheia cliente Prisma após mudança de schema | Apagar `.next/cache` e reiniciar o servidor |
| Crédito confirmado com taxa errada | Usar `confirmPayment("CREDIT", ...)` — nunca `"LINK_3X"` para parcelas manuais |
| `settings.creditFeePercent` removido | Campo não existe mais no schema/form — usar `installmentFeePercent` para Link de Pagamento |

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
- Timeline de eventos por entidade
- Exportação de relatórios (CSV/Excel)
- Rate limiting no `/api/login` via nginx/Coolify no deploy
