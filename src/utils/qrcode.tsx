import { QRCodeSVG } from 'qrcode.react';

// Testing only — swap for the real verification domain before this ever ships.
export const CERTIFICATE_VERIFY_BASE_URL = 'https://register.egalaiva.com/';

export function buildVerificationUrl(certificateId: string, baseUrl: string = CERTIFICATE_VERIFY_BASE_URL) {
  return `${baseUrl}${certificateId}`;
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
