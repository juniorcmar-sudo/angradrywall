import "dotenv/config";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Settings
  await prisma.settings.upsert({
    where: { id: "settings-default" },
    update: {},
    create: {
      id: "settings-default",
      companyName: "Angra Drywall",
      companyPhone: "(22) 99999-9999",
      companyAddress: "Angra dos Reis, RJ",
      signatureText: "Gerente Comercial",
      quoteExpirationDays: 3,
      creditFeePercent: 4.99,
      debitFeePercent: 1.99,
      installmentFeePercent: 12.71,
    },
  });

  // Categories
  const [
    catPlacas,
    catPerfis,
    catAcabamentos,
    catFixacao,
    catParafusos,
    catFitas,
    catGesso,
  ] = await Promise.all([
    prisma.category.upsert({
      where: { name: "Placas Drywall" },
      update: {},
      create: { name: "Placas Drywall", color: "#3b82f6" },
    }),
    prisma.category.upsert({
      where: { name: "Perfis e Estruturas" },
      update: {},
      create: { name: "Perfis e Estruturas", color: "#8b5cf6" },
    }),
    prisma.category.upsert({
      where: { name: "Acabamentos" },
      update: {},
      create: { name: "Acabamentos", color: "#f59e0b" },
    }),
    prisma.category.upsert({
      where: { name: "Fixação e Suspensão" },
      update: {},
      create: { name: "Fixação e Suspensão", color: "#10b981" },
    }),
    prisma.category.upsert({
      where: { name: "Parafusos" },
      update: {},
      create: { name: "Parafusos", color: "#ef4444" },
    }),
    prisma.category.upsert({
      where: { name: "Fitas e Reforços" },
      update: {},
      create: { name: "Fitas e Reforços", color: "#06b6d4" },
    }),
    prisma.category.upsert({
      where: { name: "Gesso e Massas" },
      update: {},
      create: { name: "Gesso e Massas", color: "#f97316" },
    }),
  ]);

  // Tags
  await Promise.all([
    prisma.tag.upsert({
      where: { name: "Mais vendido" },
      update: {},
      create: { name: "Mais vendido", color: "#f59e0b" },
    }),
    prisma.tag.upsert({
      where: { name: "Promoção" },
      update: {},
      create: { name: "Promoção", color: "#ef4444" },
    }),
    prisma.tag.upsert({
      where: { name: "Novo" },
      update: {},
      create: { name: "Novo", color: "#10b981" },
    }),
  ]);

  // Products — CSV: Preco_Gesseiro = basePriceDrywall, Preco_Cliente_Comum = basePriceCommon
  const products = [
    // Placas Drywall
    {
      internalCode: "PLK-001",
      name: "Placa ST",
      brand: "Knauf",
      categoryId: catPlacas.id,
      stock: 0,
      minimumStock: 50,
      basePriceDrywall: 38.5,
      basePriceCommon: 43.0,
    },
    {
      internalCode: "PLK-002",
      name: "Placa RU",
      brand: "Knauf",
      categoryId: catPlacas.id,
      stock: 0,
      minimumStock: 30,
      basePriceDrywall: 55.0,
      basePriceCommon: 65.0,
    },
    // Perfis e Estruturas
    {
      internalCode: "PES-001",
      name: "Perfil Canaleta F530",
      categoryId: catPerfis.id,
      stock: 0,
      minimumStock: 100,
      basePriceDrywall: 15.5,
      basePriceCommon: 17.0,
    },
    {
      internalCode: "PES-002",
      name: "Montante 48 Normatizado",
      categoryId: catPerfis.id,
      stock: 0,
      minimumStock: 80,
      basePriceDrywall: 20.5,
      basePriceCommon: 22.0,
    },
    {
      internalCode: "PES-003",
      name: "Guia 48 Normatizado",
      brand: "Ananda",
      categoryId: catPerfis.id,
      stock: 0,
      minimumStock: 80,
      basePriceDrywall: 19.0,
      basePriceCommon: 21.0,
    },
    {
      internalCode: "PES-004",
      name: "Montante 70 Normatizado",
      categoryId: catPerfis.id,
      stock: 0,
      minimumStock: 60,
      basePriceDrywall: 20.3,
      basePriceCommon: 22.0,
    },
    {
      internalCode: "PES-005",
      name: "Guia 70 Normatizado",
      categoryId: catPerfis.id,
      stock: 0,
      minimumStock: 60,
      basePriceDrywall: 19.5,
      basePriceCommon: 21.5,
    },
    // Acabamentos
    {
      internalCode: "ACB-001",
      name: "Cantoneira 25x30",
      categoryId: catAcabamentos.id,
      stock: 0,
      minimumStock: 50,
      basePriceDrywall: 12.5,
      basePriceCommon: 13.5,
    },
    {
      internalCode: "ACB-002",
      name: "Tabica Branca 0,50",
      categoryId: catAcabamentos.id,
      stock: 0,
      minimumStock: 30,
      basePriceDrywall: 17.5,
      basePriceCommon: 19.0,
    },
    // Fixação e Suspensão
    {
      internalCode: "FXS-001",
      name: "Tirante 3m",
      categoryId: catFixacao.id,
      stock: 0,
      minimumStock: 50,
      basePriceDrywall: 9.5,
      basePriceCommon: 10.5,
    },
    {
      internalCode: "FXS-002",
      name: "Regulador Normatizado",
      categoryId: catFixacao.id,
      stock: 0,
      minimumStock: 100,
      basePriceDrywall: 1.6,
      basePriceCommon: 1.8,
    },
    {
      internalCode: "FXS-003",
      name: "Prego Aço 15x15",
      categoryId: catFixacao.id,
      stock: 0,
      minimumStock: 20,
      basePriceDrywall: 8.5,
      basePriceCommon: 10.5,
    },
    {
      internalCode: "FXS-004",
      name: "Pino Clip Liso Cadeirinha",
      brand: "Valsywa",
      categoryId: catFixacao.id,
      stock: 0,
      minimumStock: 10,
      basePriceDrywall: 36.5,
      basePriceCommon: 39.5,
    },
    {
      internalCode: "FXS-005",
      name: "Pino Arruela",
      brand: "Valsywa",
      categoryId: catFixacao.id,
      stock: 0,
      minimumStock: 10,
      basePriceDrywall: 34.5,
      basePriceCommon: 37.5,
    },
    {
      internalCode: "FXS-006",
      name: "Pente para Pistola (10 un)",
      brand: "Valsywa",
      categoryId: catFixacao.id,
      stock: 0,
      minimumStock: 5,
      basePriceDrywall: 34.5,
      basePriceCommon: 55.0,
    },
    // Parafusos
    {
      internalCode: "PAR-001",
      name: "Parafuso GN25",
      brand: "Valsywa",
      categoryId: catParafusos.id,
      stock: 0,
      minimumStock: 10,
      basePriceDrywall: 45.0,
      basePriceCommon: 52.0,
    },
    {
      internalCode: "PAR-002",
      name: "Parafuso Metal Metal",
      brand: "Valsywa",
      categoryId: catParafusos.id,
      stock: 0,
      minimumStock: 10,
      basePriceDrywall: 55.0,
      basePriceCommon: 65.0,
    },
    // Fitas e Reforços
    {
      internalCode: "FIT-001",
      name: "Fita Telada 90",
      brand: "Valsywa",
      categoryId: catFitas.id,
      stock: 0,
      minimumStock: 20,
      basePriceDrywall: 21.9,
      basePriceCommon: 23.9,
    },
    // Gesso e Massas
    {
      internalCode: "GES-001",
      name: "Gesso Saco 40kg",
      categoryId: catGesso.id,
      stock: 0,
      minimumStock: 20,
      basePriceDrywall: 34.5,
      basePriceCommon: 38.0,
    },
    {
      internalCode: "GES-002",
      name: "Massa para Drywall 25kg",
      brand: "Knauf",
      categoryId: catGesso.id,
      stock: 0,
      minimumStock: 20,
      basePriceDrywall: 63.5,
      basePriceCommon: 66.0,
    },
    {
      internalCode: "GES-003",
      name: "Gesso Cola 5kg",
      categoryId: catGesso.id,
      stock: 0,
      minimumStock: 10,
      basePriceDrywall: 13.0,
      basePriceCommon: 15.0,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { internalCode: product.internalCode },
      update: {
        basePriceDrywall: product.basePriceDrywall,
        basePriceCommon: product.basePriceCommon,
      },
      create: product,
    });
  }

  // Freight zones
  const freightZones = [
    { name: "Centro", price: 50 },
    { name: "Japuíba", price: 60 },
    { name: "Bracuí", price: 80 },
    { name: "Monsuaba", price: 70 },
    { name: "Cunhambebe", price: 90 },
    { name: "Fora do município", price: 150 },
  ];

  for (const zone of freightZones) {
    await prisma.freightZone.upsert({
      where: { name: zone.name },
      update: {},
      create: zone,
    });
  }

  // Admin user (password: admin123)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@angradrywall.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@angradrywall.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Sample customers
  await prisma.customer.upsert({
    where: { id: "customer-sample-1" },
    update: {},
    create: {
      id: "customer-sample-1",
      name: "João Silva",
      type: "COMMON",
      phone1: "(22) 99111-2233",
      address: "Rua das Flores, 123 - Centro",
    },
  });

  await prisma.customer.upsert({
    where: { id: "customer-sample-2" },
    update: {},
    create: {
      id: "customer-sample-2",
      name: "Carlos Gesseiro",
      type: "DRYWALL_WORKER",
      phone1: "(22) 99444-5566",
      address: "Av. Brasil, 456 - Japuíba",
    },
  });

  console.log("✅ Seed completo!");
  console.log("👤 Admin: admin@angradrywall.com / admin123");
  console.log("📦 21 produtos cadastrados");
  console.log("🗂️  7 categorias criadas");
}

main()
  .catch((e: Error) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
