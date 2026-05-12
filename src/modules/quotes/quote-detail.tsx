"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PDFDownloadButton } from "@/modules/pdf/pdf-download-button";
import type { Quote, Customer, FreightZone, QuoteItem, Product, Category } from "@/types";

const STATUS_MAP = {
  DRAFT: { label: "Rascunho", variant: "gray" as const },
  SENT: { label: "Enviado", variant: "info" as const },
  AWAITING_PAYMENT: { label: "Aguard. Pagamento", variant: "warning" as const },
  PAID: { label: "Pago", variant: "success" as const },
  CANCELLED: { label: "Cancelado", variant: "destructive" as const },
};

const PAYMENT_OPTIONS = [
  { value: "PIX", label: "Pix" },
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT", label: "Débito (+1.99%)" },
  { value: "CREDIT", label: "Crédito (+4.99%)" },
  { value: "LINK_3X", label: "Maquininha (+12.71%)" },
];

type QuoteWithDetails = Quote & {
  customer: Customer;
  freightZone: FreightZone | null;
  items: (QuoteItem & { product: Product & { category: Category | null } })[];
};

interface QuoteDetailProps {
  quote: QuoteWithDetails;
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCnpj?: string;
  companyEmail?: string;
  signatureText?: string;
}

export function QuoteDetail({ quote, companyName, companyPhone, companyAddress, companyCnpj, companyEmail, signatureText }: QuoteDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<string>("");
  const [payOpen, setPayOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<string>("");

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

  async function handleSendConfirm() {
    setLoading(true);
    if (pendingMethod && !quote.paymentMethod) {
      const pmResult = await updateQuotePaymentMethod(
        quote.id,
        pendingMethod as "PIX" | "CASH" | "DEBIT" | "CREDIT" | "LINK_3X"
      );
      if (!pmResult.success) {
        toast.error(pmResult.error);
        setLoading(false);
        return;
      }
    }
    const result = await updateQuoteStatus(quote.id, "SENT");
    setLoading(false);
    setSendOpen(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Orçamento marcado como enviado!");
      router.refresh();
    }
  }

  function handleSendClick() {
    if (!quote.paymentMethod) {
      setSendOpen(true);
    } else {
      handleStatus("SENT");
    }
  }

  async function handlePayConfirm() {
    setLoading(true);
    if (payMethod && !quote.paymentMethod) {
      const pmResult = await updateQuotePaymentMethod(
        quote.id,
        payMethod as "PIX" | "CASH" | "DEBIT" | "CREDIT" | "LINK_3X"
      );
      if (!pmResult.success) {
        toast.error(pmResult.error);
        setLoading(false);
        return;
      }
    }
    const result = await updateQuoteStatus(quote.id, "PAID");
    setLoading(false);
    setPayOpen(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success("Pagamento confirmado!");
      router.refresh();
    }
  }

  function handlePayClick() {
    if (!quote.paymentMethod) {
      setPayMethod("");
      setPayOpen(true);
    } else {
      handleStatus("PAID");
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
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
        {/* Tools */}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => router.push(`/orcamentos/${quote.id}/editar`)}>
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Editar
          </Button>
        )}
        <PDFDownloadButton
          quote={quote}
          companyName={companyName}
          companyPhone={companyPhone}
          companyAddress={companyAddress}
          companyCnpj={companyCnpj}
          companyEmail={companyEmail}
          signatureText={signatureText}
        />
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

        {/* Stage action — pushed to right */}
        <div className="ml-auto flex items-center gap-2">
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
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handlePayClick}
              disabled={loading}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Confirmar Pago
            </Button>
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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-base">{quote.customer.name}</p>
                <p className="text-muted-foreground">
                  {quote.customer.type === "DRYWALL_WORKER" ? "Gesseiro" : "Cliente Comum"}
                </p>
              </div>
              {quote.customer.phone1 && (
                <p className="text-muted-foreground">{quote.customer.phone1}</p>
              )}
            </CardContent>
          </Card>

          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(quote.subtotal.toString()))}</span>
              </div>
              {Number(quote.freightValue.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{formatCurrency(Number(quote.freightValue.toString()))}</span>
                </div>
              )}
              {Number(quote.discount.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="text-red-400">
                    −{formatCurrency(Number(quote.discount.toString()))}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-3 border-t border-border">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(Number(quote.finalTotal.toString()))}
                </span>
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

      {/* Confirm payment dialog (when no payment method set) */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Este orçamento não tem forma de pagamento definida. Selecione antes de confirmar.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Forma de pagamento *</label>
            <Select value={payMethod} onValueChange={setPayMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePayConfirm}
              disabled={loading || !payMethod}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Confirmar Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send without payment method dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Marcar como Enviado</DialogTitle>
          </DialogHeader>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Este orçamento não tem forma de pagamento definida. Você pode definir agora ou enviar assim mesmo.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Forma de pagamento (opcional)</label>
            <Select value={pendingMethod} onValueChange={setPendingMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendConfirm} disabled={loading}>
              <Send className="w-3.5 h-3.5 mr-1" />
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
