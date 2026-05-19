"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
  Clock,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Printer,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@/utils/currency";
import {
  updateQuoteStatus,
  duplicateQuote,
  deleteQuote,
  updateQuotePaymentMethod,
} from "./actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PDFDownloadButton } from "@/modules/pdf/pdf-download-button";
import type { Quote, Customer, FreightZone, QuoteItem, Product, Category, QuoteCreditInstallment } from "@/types";

const STATUS_MAP = {
  DRAFT: { label: "Rascunho", variant: "gray" as const },
  SENT: { label: "Enviado", variant: "info" as const },
  AWAITING_PAYMENT: { label: "Aguard. Pagamento", variant: "warning" as const },
  PAID: { label: "Pago", variant: "success" as const },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const },
};

const PAYMENT_OPTION_KEYS = ["PIX", "CASH", "DEBIT", "LINK_3X"] as const;

type QuoteWithDetails = Quote & {
  customer: Customer;
  freightZone: FreightZone | null;
  items: (QuoteItem & { product: Product & { category: Category | null } })[];
  creditInstallments: QuoteCreditInstallment[];
};

interface TimelineEntry {
  id: string;
  action: string;
  description: string | null;
  createdAt: string | Date;
}

interface QuoteDetailProps {
  quote: QuoteWithDetails;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCnpj?: string;
  companyEmail?: string;
  signatureText?: string;
  debitFeePercent?: number;
  linkFeePercent?: number;
  timeline?: TimelineEntry[];
}

const TIMELINE_CONFIG: Record<string, { label: string; color: string }> = {
  CRIADO:             { label: "Criado",               color: "bg-gray-400" },
  SENT:               { label: "Enviado",              color: "bg-blue-500" },
  AWAITING_PAYMENT:   { label: "Aguard. Pagamento",    color: "bg-amber-500" },
  PAID:               { label: "Pago",                 color: "bg-emerald-500" },
  CANCELLED:          { label: "Cancelado",            color: "bg-red-500" },
  DRAFT:              { label: "Reaberto",             color: "bg-gray-400" },
};

export function QuoteDetail({ quote, companyName, companyPhone, companyAddress, companyCnpj, companyEmail, signatureText, debitFeePercent = 1.99, linkFeePercent = 12.71, timeline = [] }: QuoteDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Change payment method (editable until PAID)
  const [changePayOpen, setChangePayOpen] = useState(false);
  const [changeMethod, setChangeMethod] = useState<string>(quote.paymentMethod ?? "");
  const [changeInstallments, setChangeInstallments] = useState<number>(quote.installments ?? 1);

  const status = STATUS_MAP[quote.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.DRAFT;
  const isPaid = quote.status === "PAID";
  const isCancelled = quote.status === "CANCELLED";
  const isDraft = quote.status === "DRAFT";
  const isSent = quote.status === "SENT";
  const canEdit = isDraft || isSent;
  const canDelete = isDraft || isCancelled;

  async function handleStatus(newStatus: string) {
    setLoading(true);
    const result = await updateQuoteStatus(
      quote.id,
      newStatus as "DRAFT" | "SENT" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED"
    );
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Status atualizado!");
      router.refresh();
    }
  }

  function handleSendClick() {
    handleStatus("SENT");
  }

  async function confirmPayment(
    method: "PIX" | "CASH" | "DEBIT" | "LINK_3X" | "CREDIT",
    installments?: number | null,
    installmentValue?: number | null
  ) {
    setLoading(true);
    const pmResult = await updateQuotePaymentMethod(
      quote.id,
      method,
      installments ?? null,
      installmentValue ?? null
    );
    if (!pmResult.success) {
      toast.error(pmResult.error);
      setLoading(false);
      return;
    }
    const result = await updateQuoteStatus(quote.id, "PAID");
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Pagamento confirmado!");
      router.refresh();
    }
  }

  async function handleChangePayConfirm() {
    if (!changeMethod) return;
    setLoading(true);
    const isLink = changeMethod === "LINK_3X";
    const result = await updateQuotePaymentMethod(
      quote.id,
      changeMethod as "PIX" | "CASH" | "DEBIT" | "CREDIT" | "LINK_3X",
      isLink ? changeInstallments : null,
      null // installmentValue is auto-calculated server-side for LINK_3X
    );
    setLoading(false);
    setChangePayOpen(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Forma de pagamento atualizada!");
      router.refresh();
    }
  }

  async function handleDuplicate() {
    const result = await duplicateQuote(quote.id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Orçamento duplicado!");
      router.push(`/orcamentos/${result.data.id}`);
    }
  }

  async function handleDelete() {
    const result = await deleteQuote(quote.id);
    if (!result.success) {
      toast.error(result.error);
      setDeleteOpen(false);
    } else {
      toast.success("Orçamento excluído!");
      router.push("/orcamentos");
    }
  }

  function copyWhatsAppMessage() {
    const msg = `Olá, ${quote.customer.name}!\n\nSeu orçamento #${quote.number} foi gerado.\n\nTotal: ${formatCurrency(Number(quote.finalTotal.toString()))}\nValidade: ${quote.validUntil ? format(new Date(quote.validUntil), "dd/MM/yyyy") : "3 dias"}\n\nSegue PDF em anexo.`;
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem copiada!");
  }

  function copyPaymentMessage() {
    const msg = `Olá, ${quote.customer.name}!\n\nSeu orçamento #${quote.number} está aguardando pagamento.\nTotal: ${formatCurrency(Number(quote.finalTotal.toString()))}${quote.paymentMethod ? `\n\nForma de pagamento: ${PAYMENT_METHOD_LABELS[quote.paymentMethod]}` : ""}`;
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem copiada!");
  }

  function openWhatsApp() {
    const phone = quote.customer.phone1?.replace(/\D/g, "");
    if (!phone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }
    window.open(`https://wa.me/55${phone}`, "_blank");
  }

  // Build smart payment options for confirmation dropdown
  const freight = Number(quote.freightValue.toString());
  const discount = Number(quote.discount.toString());
  const baseSubtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice.toString()) * item.quantity, 0
  );
  const pixTotal = baseSubtotal + freight - discount;
  const debitTotal = baseSubtotal * (1 + debitFeePercent / 100) + freight - discount;
  const linkTotal = baseSubtotal * (1 + linkFeePercent / 100) + freight - discount;

  type PayOption = {
    label: string;
    sublabel?: string;
    method: "PIX" | "CASH" | "DEBIT" | "LINK_3X";
    installments?: number;
    installmentValue?: number;
  };

  const payOptions: PayOption[] = [];

  // PIX / Dinheiro
  payOptions.push({ label: "Pix / Dinheiro", sublabel: formatCurrency(pixTotal), method: "PIX" });
  // Débito
  payOptions.push({ label: `Débito (+${debitFeePercent}%)`, sublabel: formatCurrency(debitTotal), method: "DEBIT" });
  // Link de Pagamento — à vista + parcelas
  const linkInstallmentOptions = [1, 2, 3, 4, 5, 6];
  linkInstallmentOptions.forEach((n) => {
    payOptions.push({
      label: n === 1 ? "Link de Pagamento — À vista" : `Link de Pagamento — ${n}x`,
      sublabel: n === 1 ? formatCurrency(linkTotal) : `${formatCurrency(linkTotal / n)} / parcela = ${formatCurrency(linkTotal)}`,
      method: "LINK_3X",
      installments: n,
      installmentValue: n > 1 ? linkTotal / n : undefined,
    });
  });

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back link + header */}
      <div>
        <Link
          href="/orcamentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Orçamentos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Orçamento #{quote.number}</h1>
          <Badge variant={status.variant} className="text-sm px-3 py-1">
            {status.label}
          </Badge>
          {quote.validUntil && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Válido até {format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-2 pb-2 border-b border-border">
        {/* Linha 1 — ferramentas */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/orcamentos/${quote.id}/editar`)}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Editar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <FileText className="w-3.5 h-3.5 mr-1" />
            Duplicar
          </Button>
          <Button variant="outline" size="sm" onClick={copyWhatsAppMessage}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copiar msg
          </Button>
          <Button variant="outline" size="sm" onClick={openWhatsApp}>
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            WhatsApp
          </Button>
          {quote.status === "AWAITING_PAYMENT" && (
            <Button variant="outline" size="sm" onClick={copyPaymentMessage}>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Mensagem Pgto
            </Button>
          )}
        </div>

        {/* Linha 2 — ações de etapa */}
        <div className="flex items-center gap-2">
          {/* Cancel */}
          {!isPaid && !isCancelled && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive border-destructive/30"
              onClick={() => handleStatus("CANCELLED")}
              disabled={loading}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Cancelar
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive border-destructive/30"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Excluir
            </Button>
          )}
          {/* Primary stage button */}
          {isDraft && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSendClick}
              disabled={loading}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Marcar Enviado
            </Button>
          )}
          {isSent && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => handleStatus("AWAITING_PAYMENT")}
              disabled={loading}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Aguardando Pagamento
            </Button>
          )}
          {quote.status === "AWAITING_PAYMENT" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={loading}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Confirmar Pago
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Como o cliente pagou?
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* PIX / Débito */}
                {payOptions.filter(o => o.method !== "LINK_3X").map((opt, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => confirmPayment(opt.method)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">{opt.sublabel}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {/* Link de Pagamento */}
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">
                  Link de Pagamento (+{linkFeePercent}%)
                </DropdownMenuLabel>
                {payOptions.filter(o => o.method === "LINK_3X").map((opt, i) => (
                  <DropdownMenuItem
                    key={i}
                    onClick={() => confirmPayment("LINK_3X", opt.installments, opt.installmentValue)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm">
                      {opt.installments === 1 ? "À vista" : `${opt.installments}x de ${formatCurrency(linkTotal / opt.installments!)}`}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground ml-2">{formatCurrency(linkTotal)}</span>
                  </DropdownMenuItem>
                ))}

                {/* Crédito (maquininha) — se houver parcelas configuradas */}
                {quote.creditInstallments.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1">
                      Crédito (Maquininha)
                    </DropdownMenuLabel>
                    {quote.creditInstallments.map((ci) => {
                      const ciValue = Number(ci.value.toString());
                      const ciTotal = ciValue * ci.installments;
                      return (
                        <DropdownMenuItem
                          key={ci.id}
                          onClick={() => confirmPayment("CREDIT", ci.installments, ciValue)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-sm">
                            {ci.installments === 1 ? "À vista" : `${ci.installments}x de ${formatCurrency(ciValue)}`}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground ml-2">{formatCurrency(ciTotal)}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items + payment + notes */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.product.internalCode}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(item.unitPrice.toString()))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(item.finalPrice.toString()))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Payment & freight info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Pagamento</p>
                  <p className="font-medium">
                    {quote.paymentMethod
                      ? PAYMENT_METHOD_LABELS[quote.paymentMethod]
                      : "Não definido"}
                  </p>
                  {quote.installments && quote.installments > 1 && quote.installmentValue && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {quote.installments}x de{" "}
                      {formatCurrency(Number(quote.installmentValue.toString()))}
                    </p>
                  )}
                </div>
                {quote.freightZone && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Frete</p>
                    <p className="font-medium">{quote.freightZone.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Criado em</p>
                  <p>{format(new Date(quote.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(quote.internalNotes || quote.customerNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {quote.internalNotes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Interna</p>
                    <p>{quote.internalNotes}</p>
                  </div>
                )}
                {quote.customerNotes && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Para o cliente</p>
                    <p>{quote.customerNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: client + values */}
        <div className="sticky top-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">

              {/* Cliente */}
              <div className="px-4 py-3 space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cliente</p>
                <p className="font-semibold text-sm">{quote.customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {quote.customer.type === "DRYWALL_WORKER" ? "Gesseiro" : "Cliente Comum"}
                </p>
                {quote.customer.phone1 && (
                  <p className="text-xs text-muted-foreground">{quote.customer.phone1}</p>
                )}
              </div>

              {/* Imprimir + PDF */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                    onClick={() => window.open(`/api/orcamentos/${quote.id}/cupom`, "_blank")}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Imprimir
                  </Button>
                  <PDFDownloadButton
                    quote={quote}
                    companyName={companyName}
                    companyPhone={companyPhone}
                    companyAddress={companyAddress}
                    companyCnpj={companyCnpj}
                    companyEmail={companyEmail}
                    signatureText={signatureText}
                    debitFeePercent={debitFeePercent}
                    linkFeePercent={linkFeePercent}
                    creditInstallments={quote.creditInstallments.map((ci) => ({
                      installments: ci.installments,
                      value: Number(ci.value.toString()),
                    }))}
                    className="w-full"
                    buttonClassName="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 h-9 text-sm"
                    size="sm"
                  />
                </div>
              </div>

              {/* Valores */}
              <div className="px-4 py-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Valores</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(Number(quote.subtotal.toString()))}</span>
                </div>
                {Number(quote.freightValue.toString()) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="tabular-nums">{formatCurrency(Number(quote.freightValue.toString()))}</span>
                  </div>
                )}
                {Number(quote.discount.toString()) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-red-400 tabular-nums">
                      −{formatCurrency(Number(quote.discount.toString()))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(Number(quote.finalTotal.toString()))}
                  </span>
                </div>
                {quote.installments && quote.installments > 1 && quote.installmentValue && (
                  <p className="text-xs text-primary font-medium text-right tabular-nums">
                    {quote.installments}x de {formatCurrency(Number(quote.installmentValue.toString()))}
                  </p>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir orçamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta ação é permanente e não pode ser desfeita. O orçamento #{quote.number} será removido do sistema.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change payment method dialog */}
      <Dialog open={changePayOpen} onOpenChange={setChangePayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Forma de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Método</label>
              <Select value={changeMethod} onValueChange={(v) => {
                setChangeMethod(v);
                if (v !== "LINK_3X") setChangeInstallments(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTION_KEYS.map((k) => {
                    const feeLabel =
                      k === "DEBIT" ? ` (+${debitFeePercent}%)`
                      : k === "LINK_3X" ? ` (+${linkFeePercent}%)`
                      : "";
                    return (
                      <SelectItem key={k} value={k}>
                        {PAYMENT_METHOD_LABELS[k]}{feeLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {changeMethod === "LINK_3X" && (
              <div className="space-y-2 border border-border rounded-md p-3 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground">Parcelamento (opcional)</p>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Número de parcelas</label>
                  <Input
                    type="number" onFocus={(e) => e.target.select()}
                    min="1"
                    max="24"
                    placeholder="Ex: 3"
                    value={changeInstallments === 1 ? "" : changeInstallments}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setChangeInstallments(isNaN(v) || v < 1 ? 1 : v);
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O valor por parcela será calculado automaticamente ao salvar.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setChangePayOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangePayConfirm}
              disabled={loading || !changeMethod}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Histórico */}
      {(() => {
        // Garante sempre um evento "Criado" baseado em quote.createdAt
        // caso o orçamento seja anterior à implementação do timeline
        const hasCriado = timeline.some((e) => e.action === "CRIADO");
        const syntheticCreate: TimelineEntry | null = !hasCriado
          ? { id: "__created__", action: "CRIADO", description: "Orçamento criado", createdAt: quote.createdAt }
          : null;

        // Também sintetiza etapas a partir dos campos de data do orçamento (sentAt, paidAt, etc.)
        // quando não há evento real correspondente
        const hasAction = (action: string) => timeline.some((e) => e.action === action);
        const syntheticSent: TimelineEntry | null =
          !hasAction("SENT") && (quote as Record<string, unknown>).sentAt
            ? { id: "__sent__", action: "SENT", description: "Orçamento enviado ao cliente", createdAt: (quote as Record<string, unknown>).sentAt as Date }
            : null;
        const syntheticPaid: TimelineEntry | null =
          !hasAction("PAID") && (quote as Record<string, unknown>).paidAt
            ? { id: "__paid__", action: "PAID", description: "Pagamento confirmado", createdAt: (quote as Record<string, unknown>).paidAt as Date }
            : null;
        const syntheticCancelled: TimelineEntry | null =
          !hasAction("CANCELLED") && (quote as Record<string, unknown>).cancelledAt
            ? { id: "__cancelled__", action: "CANCELLED", description: "Orçamento cancelado", createdAt: (quote as Record<string, unknown>).cancelledAt as Date }
            : null;

        const allEvents: TimelineEntry[] = [
          ...(syntheticCreate ? [syntheticCreate] : []),
          ...timeline,
          ...(syntheticSent ? [syntheticSent] : []),
          ...(syntheticPaid ? [syntheticPaid] : []),
          ...(syntheticCancelled ? [syntheticCancelled] : []),
        ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return (
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer select-none"
              onClick={() => setHistoryOpen((v) => !v)}
            >
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Histórico
                  <span className="text-xs font-normal text-muted-foreground">
                    ({allEvents.length} evento{allEvents.length !== 1 ? "s" : ""})
                  </span>
                </span>
                {historyOpen
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </CardTitle>
            </CardHeader>
            {historyOpen && (
              <CardContent>
                <div className="relative pl-5">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                  <div className="space-y-4">
                    {allEvents.map((event, i) => {
                      const cfg = TIMELINE_CONFIG[event.action] ?? { label: event.action, color: "bg-gray-400" };
                      const date = new Date(event.createdAt);
                      const isLast = i === allEvents.length - 1;
                      return (
                        <div key={event.id} className="relative flex gap-3">
                          <div className={`absolute -left-5 mt-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${cfg.color} ${isLast ? "ring-2 ring-offset-1 ring-offset-background ring-primary/30" : ""}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold">{cfg.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })()}

    </div>
  );
}
