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

/**
 * DEBIT and LINK_3X apply automatic % fee from Settings.
 * PIX and CASH have no fee.
 * CREDIT (legacy) treated as base price.
 */
export function calculatePriceWithFee(
  basePrice: number,
  paymentMethod: string,
  debitFeePercent: number = 1.99,
  linkFeePercent: number = 12.71
): number {
  if (paymentMethod === "DEBIT") return basePrice * (1 + debitFeePercent / 100);
  if (paymentMethod === "LINK_3X") return basePrice * (1 + linkFeePercent / 100);
  return basePrice;
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  LINK_3X: "Link de Pagamento",
};
