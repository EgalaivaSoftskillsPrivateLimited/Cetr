import { QRCodeSVG } from 'qrcode.react';

// Falls back to localhost in dev. Set SITE_URL in production (e.g. to your
// deployed domain) so printed QR codes resolve correctly when scanned.
function getSiteUrl(): string {
  const configured = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  return (configured ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export function buildVerificationUrl(certificateId: string): string {
  return `${getSiteUrl()}/verify/${encodeURIComponent(certificateId)}`;
}

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
