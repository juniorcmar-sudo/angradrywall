import { getQuoteById } from "@/modules/quotes/actions";
import { getSettings } from "@/modules/settings/actions";
import { formatCurrency } from "@/utils/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { NextRequest } from "next/server";

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT: "Crédito (Maquininha)",
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
    return new Response("Orçamento não encontrado", { status: 404 });
  }

  const isPaid = quote.status === "PAID";
  const refDate = isPaid ? quote.updatedAt : quote.createdAt;
  const dateStr = format(new Date(refDate), "dd/MM/yyyy", { locale: ptBR });
  const timeStr = format(new Date(refDate), "HH:mm", { locale: ptBR });

  const subtotal = Number(quote.subtotal.toString());
  const freight = Number(quote.freightValue.toString());
  const discount = Number(quote.discount.toString());
  const total = Number(quote.finalTotal.toString());

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

  const rawName = (settings?.companyName ?? "ANGRA DRYWALL").toUpperCase();
  const companyName = esc(rawName);
  const companyPhone = settings?.companyPhone ?? "";
  const companyAddress = settings?.companyAddress ?? "";

  const itemsHtml = quote.items
    .map(
      (item) => `
        <tr>
          <td class="qty">${item.quantity}</td>
          <td class="pname">${esc(item.product.name)}</td>
          <td class="val">${formatCurrency(Number(item.finalPrice.toString()))}</td>
        </tr>`
    )
    .join("");

  const location = [quote.customer.cidade, quote.customer.uf]
    .filter(Boolean)
    .join("/");

  // Totals — usar <table> em vez de flexbox para impressão confiável
  const discountRow =
    discount > 0
      ? `<tr><td>Desconto:</td><td class="val">- ${formatCurrency(discount)}</td></tr>`
      : "";

  const freightRow =
    freight > 0
      ? `<tr><td>Frete:</td><td class="val">${formatCurrency(freight)}</td></tr>`
      : "";

  let paySection = "";
  if (payLabel) {
    paySection = `
      <hr class="d">
      <div class="block">
        <div class="lbl">PAGAMENTO</div>
        <p>${esc(payLabel)}</p>
        ${installmentLine ? `<p>${esc(installmentLine)}</p>` : ""}
        ${isPaid ? `<p>Pago em: ${dateStr} as ${timeStr}</p>` : ""}
        ${
          !isPaid && quote.validUntil
            ? `<p>Vencimento: ${format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</p>`
            : ""
        }
      </div>`;
  } else if (!isPaid && quote.validUntil) {
    paySection = `
      <hr class="d">
      <div class="block">
        <div class="lbl">VALIDADE</div>
        <p>Proposta valida ate: ${format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</p>
      </div>`;
  }

  const notesSection = quote.customerNotes
    ? `
      <hr class="d">
      <div class="block">
        <div class="lbl">OBSERVACOES</div>
        <p>${esc(quote.customerNotes)}</p>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cupom #${String(quote.number).padStart(4, "0")}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'Courier New',Courier,monospace;
      font-size:10px;
      background:#f0f0f0;
      color:#000;
      display:flex;
      justify-content:center;
      padding:12px;
    }
    .receipt{width:270px;background:#fff;padding:10px 8px}
    .top{text-align:center;margin-bottom:4px}
    .top h2{font-size:12px;font-weight:bold;letter-spacing:.5px;margin-bottom:1px;line-height:1.3}
    .top .info{margin-top:4px;font-size:8px;line-height:14px}
    .d{border:none;border-top:1px dashed #000;margin:7px 0}
    .title{text-align:center;font-weight:bold;font-size:11px;letter-spacing:.5px;margin:3px 0 1px}
    .onum{text-align:center;font-size:9px;margin-bottom:2px}
    .meta p{margin:1px 0;font-size:8px}
    .lbl{font-weight:bold;font-size:8px;letter-spacing:.5px;margin-bottom:2px}
    .block p{font-size:8px;margin:1px 0;line-height:13px}
    /* tabela de itens */
    table.items{width:100%;border-collapse:collapse;font-size:8px}
    table.items th{text-align:left;border-bottom:1px dashed #000;padding-bottom:2px;font-size:7px;font-weight:bold}
    table.items td{padding:2px 0;vertical-align:top}
    .qty{width:20px}
    .pname{padding-right:3px}
    .val{text-align:right;white-space:nowrap}
    /* tabela de totais */
    table.totals{width:100%;border-collapse:collapse;font-size:8px}
    table.totals td{padding:1px 0}
    table.totals .val{text-align:right;white-space:nowrap}
    table.totals .trow td{font-weight:bold;font-size:11px;padding-top:4px;border-top:1px dashed #000}
    .footer{text-align:center;font-size:7px;margin-top:4px;line-height:13px}
    @media print{
      @page{size:80mm auto;margin:2mm}
      body{background:#fff;padding:0}
      .receipt{width:100%;padding:0}
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="top">
      <h2>${companyName}</h2>
      ${
        companyPhone || companyAddress
          ? `<div class="info">${companyPhone ? `<div>Tel: ${esc(companyPhone)}</div>` : ""}${companyAddress ? `<div>${esc(companyAddress)}</div>` : ""}</div>`
          : ""
      }
    </div>

    <hr class="d">

    <div class="title">${isPaid ? "FECHAMENTO DE CONTA" : "ORCAMENTO"}</div>
    <div class="onum">ORCAMENTO ${String(quote.number).padStart(4, "0")}</div>
    <div class="meta">
      <p>Data: ${dateStr}</p>
      <p>Hora: ${timeStr}</p>
    </div>

    <hr class="d">

    <div class="block">
      <div class="lbl">CLIENTE</div>
      <p>${esc(quote.customer.name)}</p>
      ${quote.customer.phone1 ? `<p>Tel: ${esc(quote.customer.phone1)}</p>` : ""}
      ${location ? `<p>${esc(location)}</p>` : ""}
    </div>

    <hr class="d">

    <table class="items">
      <thead>
        <tr>
          <th class="qty">QTD</th>
          <th>PRODUTO</th>
          <th class="val">VALOR</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <hr class="d">

    <table class="totals">
      <tbody>
        <tr><td>Subtotal:</td><td class="val">${formatCurrency(subtotal)}</td></tr>
        ${discountRow}
        ${freightRow}
        <tr class="trow"><td>TOTAL:</td><td class="val">${formatCurrency(total)}</td></tr>
      </tbody>
    </table>

    ${paySection}
    ${notesSection}

    <hr class="d">

    <div class="footer">Obrigado pela preferencia!<br>erp-one-kappa.vercel.app</div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 350);
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
