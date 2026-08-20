import { QRCodeSVG } from "qrcode.react";
import { buildVerificationUrl, getSiteUrl } from "@/lib/siteUrl";

export { buildVerificationUrl, getSiteUrl };

interface CertificateQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function CertificateQRCode({ value, size = 64, className }: CertificateQRCodeProps) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      bgColor="#FFFFFF"
      fgColor="#090A0F"
      level="H"
      className={className}
    />
  );
}
