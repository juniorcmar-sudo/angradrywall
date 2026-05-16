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
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
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
  className,
  size = "sm",
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
      className={className}
    >
      {({ loading }) => (
        <Button variant="outline" size={size} disabled={loading} className={className ? "w-full" : undefined}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          {loading ? "Gerando..." : "Baixar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
