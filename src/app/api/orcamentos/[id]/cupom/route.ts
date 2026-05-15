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

  const companyName = esc((settings?.companyName ?? "ANGRA DRYWALL").toUpperCase());
  const companyPhone = settings?.companyPhone ?? "";
  const companyAddress = settings?.companyAddress ?? "";

  const itemsHtml = quote.items
    .map(
      (item) => `
        <tr>
          <td>${item.quantity}</td>
          <td class="pname">${esc(item.product.name)}</td>
          <td>${formatCurrency(Number(item.finalPrice.toString()))}</td>
        </tr>`
    )
    .join("");

  const location = [quote.customer.cidade, quote.customer.uf]
    .filter(Boolean)
    .join("/");

  const discountRow =
    discount > 0
      ? `<div class="row"><span>Desconto:</span><span>- ${formatCurrency(discount)}</span></div>`
      : "";

  const freightRow =
    freight > 0
      ? `<div class="row"><span>Frete:</span><span>${formatCurrency(freight)}</span></div>`
      : "";

  let paySection = "";
  if (payLabel) {
    paySection = `
      <hr class="d">
      <div class="block">
        <div class="lbl">PAGAMENTO</div>
        <p>${esc(payLabel)}</p>
        ${installmentLine ? `<p>${esc(installmentLine)}</p>` : ""}
        ${isPaid ? `<p>Pago em: ${dateStr} às ${timeStr}</p>` : ""}
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
        <p>Proposta válida até: ${format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: ptBR })}</p>
      </div>`;
  }

  const notesSection = quote.customerNotes
    ? `
      <hr class="d">
      <div class="block">
        <div class="lbl">OBSERVAÇÕES</div>
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
      padding:16px;
    }
    .receipt{width:290px;background:#fff;padding:12px 10px}
    .top{text-align:center;margin-bottom:5px}
    .top h2{font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:1px}
    .top .sub{font-size:9px}
    .top .info{margin-top:5px;font-size:9px;line-height:15px}
    .d{border:none;border-top:1px dashed #000;margin:8px 0}
    .title{text-align:center;font-weight:bold;font-size:12px;letter-spacing:1px;margin:4px 0 2px}
    .onum{text-align:center;font-size:10px;margin-bottom:3px}
    .meta p{margin:2px 0;font-size:9px}
    .lbl{font-weight:bold;font-size:9px;letter-spacing:1px;margin-bottom:3px}
    .block p{font-size:9px;margin:2px 0;line-height:14px}
    table{width:100%;border-collapse:collapse;font-size:9px}
    th{text-align:left;border-bottom:1px dashed #000;padding-bottom:3px;font-size:8px;font-weight:bold;letter-spacing:.5px}
    th:last-child,td:last-child{text-align:right}
    td{padding:3px 0;vertical-align:top}
    .pname{padding-right:4px}
    .totals{font-size:9px}
    .row{display:flex;justify-content:space-between;margin:2px 0}
    .trow{display:flex;justify-content:space-between;font-weight:bold;font-size:12px;margin-top:5px;padding-top:3px;border-top:1px dashed #000}
    .footer{text-align:center;font-size:8px;margin-top:5px;line-height:14px}
    @media print{
      @page{size:80mm auto;margin:3mm}
      body{background:#fff;padding:0}
      .receipt{width:100%;padding:0}
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="top">
      <h2>${companyName}</h2>
      <div class="sub">DISTRIBUIDORA</div>
      ${
        companyPhone || companyAddress
          ? `<div class="info">${companyPhone ? `<div>Tel: ${esc(companyPhone)}</div>` : ""}${companyAddress ? `<div>${esc(companyAddress)}</div>` : ""}</div>`
          : ""
      }
    </div>

    <hr class="d">

    <div class="title">${isPaid ? "FECHAMENTO DE CONTA" : "ORÇAMENTO"}</div>
    <div class="onum">ORÇAMENTO ${String(quote.number).padStart(4, "0")}</div>
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

    <table>
      <thead>
        <tr>
          <th style="width:28px">QTD</th>
          <th>PRODUTO</th>
          <th>VALOR</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <hr class="d">

    <div class="totals">
      <div class="row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>
      ${discountRow}
      ${freightRow}
      <div class="trow"><span>TOTAL:</span><span>${formatCurrency(total)}</span></div>
    </div>

    ${paySection}
    ${notesSection}

    <hr class="d">

    <div class="footer">Obrigado pela preferência!<br>erp-one-kappa.vercel.app</div>
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
