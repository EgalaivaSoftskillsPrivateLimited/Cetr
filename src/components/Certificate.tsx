'use client';

import { CertificateQRCode } from '@/utils/qrcode';

interface CertificateProps {
  recipientName: string;
  programName: string;
  duration: string;
  companyName: string;
  issueDate: string;
  founderName: string;
  founderTitle: string;
  certificateId: string;
  verificationUrl: string;
  showPrintButton?: boolean;
}

export default function Certificate({
  recipientName,
  programName,
  duration,
  companyName,
  issueDate,
  founderName,
  founderTitle,
  certificateId,
  verificationUrl,
  showPrintButton = true,
}: CertificateProps) {
  return (
    <>
      {/* Import Custom Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');

        .font-sans-cert {
          font-family: 'Montserrat', sans-serif;
        }
        .font-recipient {
          font-family: 'Alex Brush', cursive;
        }

        @page {
          size: 297mm 210mm;
          margin: 0;
        }

        @media print {
          html, body {
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .cert-wrapper {
            min-height: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .cert-container {
            box-shadow: none !important;
            margin: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            page-break-after: always;
          }
        }
      `}</style>

      <div className="cert-wrapper flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-4 no-print:py-10">
        {/* Printable Certificate Frame */}
        <div className="cert-container relative w-[297mm] h-[210mm] bg-[#0b0c10] text-white overflow-hidden shadow-2xl flex font-sans-cert select-none">

          {/* ================= LEFT SIDEBAR ================= */}
          <div className="relative w-[28%] bg-[#12141c] border-r border-white/10 flex flex-col justify-between p-8 overflow-hidden z-10">

            {/* Horizontally Centered Vertical Egalaiva Watermark */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[100px] font-black tracking-widest text-white/[0.04] pointer-events-none whitespace-nowrap uppercase select-none origin-center"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Egalaiva
            </div>

            {/* Abstract Polygon Mesh Lines Background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 320 800"
              preserveAspectRatio="none"
            >
              <path d="M-50 100 L350 400 M-50 300 L350 600 M100 -50 L400 700 M-100 500 L300 900" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <path d="M0 200 L320 100 M0 600 L320 500" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </svg>

            {/* Top Box: Certificate Date & Metadata */}
            <div className="relative z-10 w-[85%] mx-auto border border-white/30 p-6 text-center bg-black/20 backdrop-blur-xs">
              <h3 className="text-[#8ba2ff] font-bold text-lg tracking-wide mb-2">
                The Egalaiva
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed font-normal mb-5">
                grants and certifies<br />this certificate on
              </p>
              <div className="border-t border-white/30 pt-3">
                <span className="text-xs font-semibold tracking-wider text-white">
                  {issueDate}
                </span>
              </div>
            </div>

            {/* Bottom Section: Egalaiva Brand Logo */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-12 mb-1 relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Egalaiva logo"
                  className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(115,145,255,0.6)]"
                />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">Egalaiva</span>
            </div>
          </div>

          {/* ================= RIGHT MAIN CONTENT ================= */}
          <div className="relative w-[72%] p-14 flex flex-col justify-between z-10 bg-gradient-to-br from-[#0e1017] via-[#0b0c10] to-[#121520]">

            {/* Soft Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Main Certificate Titles */}
            <div className="mt-4">
              <h1 className="text-6xl font-extrabold text-[#9bb1ff] tracking-tight mb-0">
                Certificate
              </h1>
              <h2 className="text-6xl font-extrabold text-white tracking-tight">
                Of Appreciation
              </h2>
            </div>

            {/* Recipient Designation & Name */}
            <div className="my-3">
              <p className="text-sm font-normal text-gray-300 tracking-wide mb-1">
                This Certificate Is Given To
              </p>
              <div className="font-recipient text-7xl text-[#8da5ff] leading-normal py-1 drop-shadow-[0_0_10px_rgba(141,165,255,0.25)]">
                {recipientName}
              </div>
            </div>

            {/* Description Body */}
            <p className="text-base text-gray-300 font-light leading-relaxed max-w-xl">
              Has successfully completed{' '}
              <strong className="font-bold text-white">“{programName}”</strong>{' '}
              program for {duration} at {companyName} showcasing grand excellence & dedication
            </p>

            {/* Bottom Footer: Signatures, Seal & QR Code */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">

              {/* Signature Section */}
              <div className="flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sign/sign.png"
                  alt={`${founderName} signature`}
                  className="h-10 w-auto object-contain object-left mb-1 select-none"
                />
                <div className="text-base font-bold text-[#8da5ff] tracking-wider uppercase">
                  {founderName}
                </div>
                <div className="text-xs text-gray-400 font-light">
                  ({founderTitle})
                </div>
              </div>

              {/* Circular Seal & Integrated QR Code */}
              <div className="flex items-center gap-4">
                {/* Egalaiva Circular Seal */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/badge.png"
                    alt="Egalaiva seal"
                    className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Verification QR Code */}
                <div className="bg-white p-2 rounded-lg shadow-md flex flex-col items-center border border-white/20">
                  <CertificateQRCode value={verificationUrl} size={64} />
                  <span className="text-[7px] text-black font-bold tracking-tighter mt-1 uppercase">
                    Scan to Verify
                  </span>
                  <span className="text-[6px] text-gray-600 font-semibold tracking-wider mt-0.5">
                    {certificateId}
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Print / Save Action Button */}
        {showPrintButton && (
          <button
            onClick={() => window.print()}
            className="no-print mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-md shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as A4 PDF
          </button>
        )}
      </div>
    </>
  );
}
