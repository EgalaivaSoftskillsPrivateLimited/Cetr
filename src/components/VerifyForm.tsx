"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, fieldInput } from "@/ui";

export default function VerifyForm() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = certificateId.trim();
        if (trimmed) {
          router.push(`/verify/${encodeURIComponent(trimmed)}`);
        }
      }}
      className="flex w-full flex-col gap-3"
    >
      <div className={fieldInput}>
        <input
          type="text"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
          placeholder="e.g. EGALAIVA-XXXXXX"
          autoComplete="off"
          className="min-w-0 flex-1 border-none bg-transparent py-3 font-mono text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
      </div>
      <button type="submit" className={`${btnPrimary} w-full`}>
        Verify
      </button>
    </form>
  );
}
