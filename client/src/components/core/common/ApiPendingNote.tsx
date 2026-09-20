interface ApiPendingNoteProps {
  /** Ten khoi du lieu/tinh nang dang thieu API, vd: "Members" */
  label: string;
  /** Mo ta ngan se hien thi gi khi co API that */
  hint?: string;
  /** true = the nho inline (vd trong 1 hang), false = khoi block */
  compact?: boolean;
  className?: string;
}

export function ApiPendingNote({ label, hint, compact = false, className = '' }: ApiPendingNoteProps) {
  if (compact) {
    return (
      <span
        title={hint}
        className={`inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-muted-foreground)] ${className}`}
      >
        Chưa có API — {label}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-muted-foreground)] ${className}`}
    >
      <span className="font-bold text-[var(--color-primary)]">Chưa có API</span>
      <span> — {label}{hint ? `: ${hint}` : ''}</span>
    </div>
  );
}

export default ApiPendingNote;
