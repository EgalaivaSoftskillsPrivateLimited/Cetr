import Link from 'next/link';
import { getCertificate } from '@/data/certificates';

export default async function VerifyPage({
  params,
}: PageProps<'/verify/[certificateId]'>) {
  const { certificateId } = await params;
  const record = getCertificate(certificateId);

  if (!record) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Certificate not found</h1>
        <p className="text-gray-500 max-w-md">
          No certificate matches ID <span className="font-mono">{certificateId}</span>.
          Double-check the ID or QR code and try again.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Certificate Verified
        </span>
        <h1 className="text-3xl font-bold">{record.recipientName}</h1>
        <p className="text-gray-500">
          Issued by {record.companyName} on {record.issueDate}
        </p>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm w-full max-w-md">
        <dt className="text-gray-500">Program</dt>
        <dd className="font-medium">{record.programName}</dd>
        <dt className="text-gray-500">Duration</dt>
        <dd className="font-medium">{record.duration}</dd>
        <dt className="text-gray-500">Issued by</dt>
        <dd className="font-medium">
          {record.founderName} ({record.founderTitle})
        </dd>
        <dt className="text-gray-500">Certificate ID</dt>
        <dd className="font-mono">{record.certificateId}</dd>
      </dl>

      <a
        href={record.pdfPath}
        download
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-md shadow-lg transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download Certificate (PDF)
      </a>

      <iframe
        src={record.pdfPath}
        title={`Certificate ${record.certificateId}`}
        className="w-full max-w-3xl aspect-[297/210] border rounded-md"
      />
    </main>
  );
}
