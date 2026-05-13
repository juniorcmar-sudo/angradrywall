"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotePDF } from "./quote-pdf";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import type { QuotePDFProps, CreditInstallmentProp } from "./quote-pdf";

type Props = Omit<QuotePDFProps, "logoUrl"> & {
  fileName: string;
  logoUrl: string;
  debitFeePercent?: number;
  linkFeePercent?: number;
  creditInstallments?: CreditInstallmentProp[];
};

export function PDFButtonInner({
  quote,
  companyName,
  companyPhone,
  companyAddress,
  companyCnpj,
  companyEmail,
  signatureText,
  logoUrl,
  fileName,
  debitFeePercent,
  linkFeePercent,
  creditInstallments,
}: Props) {
  return (
    <PDFDownloadLink
      document={
        <QuotePDF
          quote={quote}
          companyName={companyName}
          companyPhone={companyPhone}
          companyAddress={companyAddress}
          companyCnpj={companyCnpj}
          companyEmail={companyEmail}
          signatureText={signatureText}
          logoUrl={logoUrl}
          debitFeePercent={debitFeePercent}
          linkFeePercent={linkFeePercent}
          creditInstallments={creditInstallments}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5 mr-1" />
          )}
          {loading ? "Gerando PDF..." : "Baixar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
