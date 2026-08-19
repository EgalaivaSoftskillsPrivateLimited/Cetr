'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyForm() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = certificateId.trim();
        if (trimmed) {
          router.push(`/verify/${encodeURIComponent(trimmed)}`);
        }
      }}
      className="flex w-full max-w-sm gap-2"
    >
      <input
        type="text"
        value={certificateId}
        onChange={(e) => setCertificateId(e.target.value)}
        placeholder="e.g. CERT-2025-8892"
        className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm font-mono"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-md shadow-lg transition-all"
      >
        Verify
      </button>
    </form>
  );
}
