export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_16px_30px_rgba(47,94,255,0.35)] transition-all hover:bg-blue-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue disabled:active:scale-100";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-transparent px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition-all hover:bg-ink/5 active:scale-[0.98]";

export const fieldInput =
  "flex items-center gap-3 rounded-xl border border-ink/12 bg-paper px-4 transition-colors focus-within:border-blue";

export const fieldSelect =
  "w-full rounded-xl border border-ink/12 bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-blue";

export function AnnotationTag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-cream shadow-[0_10px_24px_rgba(0,0,0,0.35)] ${className}`}
    >
      {children}
    </span>
  );
}

export function CornerHandles({ dark = false }: { dark?: boolean }) {
  const dot = `absolute h-1.5 w-1.5 rounded-full ${dark ? "bg-white/60" : "bg-ink/35"}`;
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      <span className={`${dot} -left-[3px] -top-[3px]`} />
      <span className={`${dot} -right-[3px] -top-[3px]`} />
      <span className={`${dot} -bottom-[3px] -left-[3px]`} />
      <span className={`${dot} -bottom-[3px] -right-[3px]`} />
    </span>
  );
}

export function CursorBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-paper text-ink shadow-[0_14px_30px_rgba(0,0,0,0.35)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path d="M5 3l14 6.2-5.8 2-2 5.8L5 3z" fill="currentColor" />
      </svg>
    </span>
  );
}

/**
 * Brand convention: lime is the accent on dark (navy) surfaces, blue is the
 * accent on light (paper) surfaces — matches register.egalaiva.com.
 */
export function Eyebrow({
  children,
  on = "light",
}: {
  children: React.ReactNode;
  on?: "light" | "dark";
}) {
  const tone = on === "dark" ? "text-lime" : "text-blue";
  const dot = on === "dark" ? "bg-lime" : "bg-blue";
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] ${tone}`}>
      <span className={`h-1.5 w-1.5 animate-pulse-dot rounded-full ${dot}`} />
      {children}
    </span>
  );
}
