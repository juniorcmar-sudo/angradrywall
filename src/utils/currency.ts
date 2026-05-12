export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
}

export const PAYMENT_FEES: Record<string, number> = {
  PIX: 0,
  CASH: 0,
  DEBIT: 1.99,
  CREDIT: 4.99,
  LINK_3X: 12.71,
};

export function calculatePriceWithFee(
  basePrice: number,
  paymentMethod: string
): number {
  const fee = PAYMENT_FEES[paymentMethod] ?? 0;
  return basePrice * (1 + fee / 100);
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  LINK_3X: "Maquininha",
};
