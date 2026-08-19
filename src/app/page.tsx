import Link from 'next/link';
import VerifyForm from '@/components/VerifyForm';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Egalaiva logo" className="w-16 h-16 object-contain" />
        <h1 className="text-3xl font-bold">Egalaiva Certificate Portal</h1>
        <p className="text-gray-500 max-w-md">
          Enter a certificate ID to verify its authenticity and download a copy.
        </p>
      </div>

      <VerifyForm />

      <Link href="/certificate-print" className="text-sm text-gray-500 hover:underline">
        Issue a certificate →
      </Link>
    </main>
  );
}
