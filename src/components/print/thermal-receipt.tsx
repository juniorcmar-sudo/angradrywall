import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/currency";

// Tipos inline para evitar importar Decimal do Prisma no componente de print
interface ReceiptItem {
  quantity: number;
  product: { name: string; internalCode: string };
  finalPrice: { toString(): string };
  unitPrice: { toString(): string };
}

interface ReceiptCreditInstallment {
  installments: number;
  value: { toString(): string };
}

interface ReceiptCustomer {
  name: string;
  phone1?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

interface ReceiptQuote {
  number: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  validUntil?: Date | null;
  paymentMethod?: string | null;
  installments?: number | null;
  installmentValue?: { toString(): string } | null;
  subtotal: { toString(): string };
  freightValue: { toString(): string };
  discount: { toString(): string };
  finalTotal: { toString(): string };
  customerNotes?: string | null;
  freightType?: string | null;
  customer: ReceiptCustomer;
  items: ReceiptItem[];
  creditInstallments: ReceiptCreditInstallment[];
}

interface ReceiptSettings {
  companyName?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyCnpj?: string | null;
  installmentFeePercent?: { toString(): string } | null;
  debitFeePercent?: { toString(): string } | null;
}

interface ThermalReceiptProps {
  quote: ReceiptQuote;
  settings?: ReceiptSettings | null;
}

const PAYMENT_LABEL_PT: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT: "Crédito (Maquininha)",
  LINK_3X: "Link de Pagamento",
};

export function ThermalReceipt({ quote, settings }: ThermalReceiptProps) {
  const isPaid = quote.status === "PAID";
  const refDate = isPaid ? quote.updatedAt : quote.createdAt;
  const dateStr = format(new Date(refDate), "dd/MM/yyyy", { locale: ptBR });
  const timeStr = format(new Date(refDate), "HH:mm", { locale: ptBR });

  const subtotal = Number(quote.subtotal.toString());
  const freight = Number(quote.freightValue.toString());
  const discount = Number(quote.discount.toString());
  const total = Number(quote.finalTotal.toString());

  const payLabel = quote.paymentMethod
    ? PAYMENT_LABEL_PT[quote.paymentMethod] ?? quote.paymentMethod
    : null;

  // Installment display
  let installmentLine: string | null = null;
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
    const ciVal = Number(ci.value.toString());
    if (ci.installments > 1) {
      installmentLine = `${ci.installments}x de ${formatCurrency(ciVal)}`;
    }
  }

  const companyName = settings?.companyName ?? "ANGRA DRYWALL";
  const companyPhone = settings?.companyPhone;
  const companyAddress = settings?.companyAddress;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Courier New', Courier, monospace !important;
          font-size: 10px !important;
          background: #f0f0f0 !important;
          color: #000 !important;
          display: flex !important;
          justify-content: center !important;
          padding: 16px !important;
          min-height: 100vh !important;
        }

        .receipt {
          width: 290px;
          background: #fff;
          padding: 12px 10px;
          color: #000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 10px;
        }

        .top {
          text-align: center;
          margin-bottom: 5px;
        }

        .top h2 {
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 1px;
        }

        .top .sub {
          font-size: 9px;
        }

        .top .info {
          margin-top: 5px;
          font-size: 9px;
          line-height: 15px;
        }

        .divider {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

        .title {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          letter-spacing: 1px;
          margin: 4px 0 2px;
        }

        .order-num {
          text-align: center;
          font-size: 10px;
          margin-bottom: 3px;
        }

        .meta p {
          margin: 2px 0;
          font-size: 9px;
        }

        .section-label {
          font-weight: bold;
          font-size: 9px;
          letter-spacing: 1px;
          margin-bottom: 3px;
        }

        .client p {
          font-size: 9px;
          margin: 2px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }

        th {
          text-align: left;
          border-bottom: 1px dashed #000;
          padding-bottom: 3px;
          font-size: 8px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        th:last-child, td:last-child {
          text-align: right;
        }

        td {
          padding: 3px 0;
          vertical-align: top;
        }

        td.product-name {
          padding-right: 4px;
        }

        .totals {
          font-size: 9px;
        }

        .totals .row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }

        .totals .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 12px;
          margin-top: 5px;
          padding-top: 3px;
          border-top: 1px dashed #000;
        }

        .payment p {
          font-size: 9px;
          margin: 2px 0;
        }

        .obs p {
          font-size: 9px;
          margin: 2px 0;
          line-height: 14px;
        }

        .footer {
          text-align: center;
          font-size: 8px;
          margin-top: 5px;
          line-height: 14px;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 3mm;
          }
          body {
            background: #fff !important;
            padding: 0 !important;
          }
          .receipt {
            width: 100%;
            padding: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="receipt">
        {/* Cabeçalho */}
        <div className="top">
          <h2>{companyName.toUpperCase()}</h2>
          <div className="sub">DISTRIBUIDORA</div>
          {(companyPhone || companyAddress) && (
            <div className="info">
              {companyPhone && <div>Tel: {companyPhone}</div>}
              {companyAddress && <div>{companyAddress}</div>}
            </div>
          )}
        </div>

        <hr className="divider" />

        {/* Título */}
        <div className="title">{isPaid ? "FECHAMENTO DE CONTA" : "ORÇAMENTO"}</div>
        <div className="order-num">
          ORÇAMENTO {String(quote.number).padStart(4, "0")}
        </div>

        {/* Meta */}
        <div className="meta">
          <p>Data: {dateStr}</p>
          <p>Hora: {timeStr}</p>
        </div>

        <hr className="divider" />

        {/* Cliente */}
        <div className="client">
          <div className="section-label">CLIENTE</div>
          <p>{quote.customer.name}</p>
          {quote.customer.phone1 && <p>Tel: {quote.customer.phone1}</p>}
          {(quote.customer.cidade || quote.customer.uf) && (
            <p>
              {[quote.customer.cidade, quote.customer.uf]
                .filter(Boolean)
                .join("/")}
            </p>
          )}
        </div>

        <hr className="divider" />

        {/* Itens */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "28px" }}>QTD</th>
              <th>PRODUTO</th>
              <th>VALOR</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr key={i}>
                <td>{item.quantity}</td>
                <td className="product-name">{item.product.name}</td>
                <td>{formatCurrency(Number(item.finalPrice.toString()))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="divider" />

        {/* Totais */}
        <div className="totals">
          <div className="row">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="row">
              <span>Desconto:</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}
          {freight > 0 && (
            <div className="row">
              <span>Frete:</span>
              <span>{formatCurrency(freight)}</span>
            </div>
          )}
          <div className="total-row">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Pagamento */}
        {payLabel && (
          <>
            <hr className="divider" />
            <div className="payment">
              <div className="section-label">PAGAMENTO</div>
              <p>{payLabel}</p>
              {installmentLine && <p>{installmentLine}</p>}
              {isPaid && (
                <p>
                  Pago em: {dateStr} às {timeStr}
                </p>
              )}
              {!isPaid && quote.validUntil && (
                <p>
                  Vencimento:{" "}
                  {format(new Date(quote.validUntil), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </>
        )}

        {/* Validade (se não pago e sem método definido) */}
        {!isPaid && !payLabel && quote.validUntil && (
          <>
            <hr className="divider" />
            <div className="obs">
              <div className="section-label">VALIDADE</div>
              <p>
                Proposta válida até:{" "}
                {format(new Date(quote.validUntil), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </>
        )}

        {/* Observações */}
        {quote.customerNotes && (
          <>
            <hr className="divider" />
            <div className="obs">
              <div className="section-label">OBSERVAÇÕES</div>
              <p>{quote.customerNotes}</p>
            </div>
          </>
        )}

        <hr className="divider" />

        {/* Rodapé */}
        <div className="footer">
          Obrigado pela preferência!
          <br />
          erp-one-kappa.vercel.app
        </div>
      </div>
    </>
  );
}
