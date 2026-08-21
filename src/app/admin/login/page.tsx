"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, CornerHandles, Eyebrow } from "@/ui";

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-blue";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Invalid username or password.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-soft px-5 py-10">
      <div className="relative w-full max-w-[380px] rounded-[28px] border-[1.5px] border-dashed border-ink/15 bg-paper p-9 shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
        <CornerHandles />
        <Eyebrow>Admin</Eyebrow>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-ink">
          Sign In
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Sign in to generate one-time certificate claim links.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className={inputClass}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wide text-ink/65" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-danger" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={`${btnPrimary} mt-1 w-full`}>
            {isSubmitting ? "Signing In…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}
