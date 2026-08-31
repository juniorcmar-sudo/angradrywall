import type { QuoteStatus } from "@/types";

export const QUOTE_STATUS_MAP: Record<
  QuoteStatus,
  { label: string; variant: "gray" | "info" | "warning" | "success" | "destructive" }
> = {
  DRAFT: { label: "Rascunho", variant: "gray" },
  SENT: { label: "Enviado", variant: "info" },
  AWAITING_PAYMENT: { label: "Aguard. Pagamento", variant: "warning" },
  PAID: { label: "Pago", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "destructive" },
};

export function getQuoteStatus(status: string) {
  return QUOTE_STATUS_MAP[status as QuoteStatus] ?? QUOTE_STATUS_MAP.DRAFT;
}
