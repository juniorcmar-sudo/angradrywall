import { getQuoteById } from "@/modules/quotes/actions";
import { getSettings } from "@/modules/settings/actions";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NextRequest } from "next/server";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  DEBIT: "Debito",
  CREDIT: "Credito (Maquininha)",
  LINK_3X: "Link de Pagamento",
};

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [quote, settings] = await Promise.all([
    getQuoteById(id),
    getSettings(),
  ]);

  if (!quote) {
    return new Response("Orcamento nao encontrado", { status: 404 });
  }

  const isPaid = quote.status === "PAID";
  const refDate = isPaid ? quote.updatedAt : quote.createdAt;
  const dateStr = format(new Date(refDate), "dd/MM/yyyy", { locale: ptBR });
  const timeStr = format(new Date(refDate), "HH:mm", { locale: ptBR });

  const subtotal = Number(quote.subtotal.toString());
  const freight  = Number(quote.freightValue.toString());
  const discount = Number(quote.discount.toString());
  const total    = Number(quote.finalTotal.toString());

  const payLabel = quote.paymentMethod
    ? (PAYMENT_LABEL[quote.paymentMethod] ?? quote.paymentMethod)
    : null;

  let installmentLine = "";
  if (
    quote.paymentMethod === "LINK_3X" &&
    quote.installments &&
    quote.installments > 1 &&
    quote.installmentValue
  ) {
    installmentLine = `${quote.installments}x de ${formatCurrency(Number(quote.installmentValue.toString()))}`;
  } else if (
    quote.paymentMethod === "CREDIT" &&
    quote.creditInstallments.length > 0
  ) {
    const ci = quote.creditInstallments[0];
    if (ci.installments > 1) {
      installmentLine = `${ci.installments}x de ${formatCurrency(Number(ci.value.toString()))}`;
    }
  }

  // Quebra o nome da empresa no " - " para cada parte ficar na sua linha
  const companyName  = esc((settings?.companyName  ?? "ANGRA DRYWALL").toUpperCase()).replace(' - ', '<br>').replace(' – ', '<br>');
  const companyPhone = settings?.companyPhone   ?? "";
  const companyAddress = settings?.companyAddress ?? "";

  // Itens: nome + qtd numa linha, valor na linha seguinte
  const itemsHtml = quote.items.map((item) => {
    const val = formatCurrency(Number(item.finalPrice.toString()));
    return `<p class="item-name">${item.quantity}x ${esc(item.product.name)}</p><p class="item-val">${val}</p>`;
  }).join("");

  // Totais
  const totalRows = [
    `<p>Subtotal: ${formatCurrency(subtotal)}</p>`,
    discount > 0 ? `<p>Desconto: -${formatCurrency(discount)}</p>` : "",
    freight  > 0 ? `<p>Frete: ${formatCurrency(freight)}</p>`      : "",
  ].join("");

  // Pagamento
  let paySection = "";
  if (payLabel) {
    paySection = `
      <hr class="d">
      <p class="lbl">PAGAMENTO</p>
      <p>${esc(payLabel)}</p>
      ${installmentLine ? `<p>${esc(installmentLine)}</p>` : ""}
      ${isPaid ? `<p>Pago em: ${dateStr} as ${timeStr}</p>` : ""}
      ${!isPaid && quote.validUntil ? `<p>Venc.: ${format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</p>` : ""}`;
  } else if (!isPaid && quote.validUntil) {
    paySection = `
      <hr class="d">
      <p class="lbl">VALIDADE</p>
      <p>Valida ate: ${format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</p>`;
  }

  const notesSection = quote.customerNotes
    ? `<hr class="d"><p class="lbl">OBSERVACOES</p><p>${esc(quote.customerNotes)}</p>`
    : "";

  const location = [quote.customer.cidade, quote.customer.uf].filter(Boolean).join("/");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Cupom #${String(quote.number).padStart(4, "0")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; overflow-wrap: break-word; word-break: break-word; font-weight: 900; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      background: #eee;
      color: #000;
      display: flex;
      justify-content: center;
      padding: 12px;
    }
    .receipt {
      width: 200px;
      background: #fff;
      padding: 8px 6px;
    }
    .center { text-align: center; }
    h2 { font-size: 12px; line-height: 1.4; margin-bottom: 2px; }
    .info { font-size: 10px; line-height: 15px; margin-top: 3px; }
    .d { border: none; border-top: 2px dashed #000; margin: 7px 0; }
    .title { text-align: center; font-size: 12px; margin: 4px 0 2px; }
    .onum  { text-align: center; font-size: 10px; margin-bottom: 3px; }
    p { font-size: 10px; line-height: 15px; margin: 2px 0; }
    .lbl { font-size: 10px; margin-bottom: 3px; letter-spacing: 0; }
    .item-name { font-size: 10px; margin-top: 4px; }
    .item-val  { font-size: 10px; padding-left: 8px; margin-bottom: 2px; }
    .total-block { margin-top: 3px; font-size: 10px; }
    .total-block p { margin: 2px 0; }
    .grand-total { font-size: 13px; margin-top: 5px; border-top: 2px dashed #000; padding-top: 4px; }
    .footer { text-align: center; font-size: 9px; margin-top: 5px; line-height: 14px; }

    @media print {
      @page { size: 58mm auto; margin: 0; }
      body {
        display: block;
        background: #fff;
        padding: 0;
        margin: 0;
        font-size: 10px;
      }
      .receipt {
        width: 100%;
        max-width: 100%;
        padding: 1mm 2mm;
        margin: 0;
      }
      h2 { font-size: 11px; }
      .title { font-size: 11px; }
      .onum, p, .lbl, .item-name, .item-val, .footer { font-size: 9px; }
      .info { font-size: 8px; word-break: break-all; }
      .grand-total { font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="receipt">

    <div class="center">
      <h2>${companyName}</h2>
      ${companyPhone || companyAddress ? `<div class="info">${companyPhone ? `Tel: ${esc(companyPhone)}<br>` : ""}${companyAddress ? esc(companyAddress) : ""}</div>` : ""}
    </div>

    <hr class="d">

    <div class="title">${isPaid ? "FECHAMENTO DE CONTA" : "ORCAMENTO"}</div>
    <div class="onum">ORCAMENTO ${String(quote.number).padStart(4, "0")}</div>
    <p>Data: ${dateStr} &nbsp; Hora: ${timeStr}</p>

    <hr class="d">

    <p class="lbl">CLIENTE</p>
    <p>${esc(quote.customer.name)}</p>
    ${quote.customer.phone1 ? `<p>Tel: ${esc(quote.customer.phone1)}</p>` : ""}
    ${location ? `<p>${esc(location)}</p>` : ""}

    <hr class="d">

    <p class="lbl">ITENS</p>
    ${itemsHtml}

    <hr class="d">

    <div class="total-block">
      ${totalRows}
      <p class="grand-total">TOTAL: ${formatCurrency(total)}</p>
    </div>

    ${paySection}
    ${notesSection}

    <hr class="d">

    <div class="footer">Obrigado pela preferencia!<br>erp-one-kappa.vercel.app</div>
  </div>

  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.print();
        window.onafterprint = function () { window.close(); };
      }, 350);
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
