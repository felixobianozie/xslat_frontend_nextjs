// ─────────────────────────────────────────────────────────────────────────────
// Statusnotice.tsx
//
// The inline message bar shared by the account verification form and the staff
// invitation form. It repeats the latest toast so the person keeps a visible
// record of what just happened (code sent, wrong code, locked, success).
//
// Green with a tick for success, red with an exclamation mark for errors. It is
// announced politely to screen readers.
// ─────────────────────────────────────────────────────────────────────────────

interface StatusNoticeProps {
  kind: "success" | "error";
  message: string;
}

export default function StatusNotice({ kind, message }: StatusNoticeProps) {
  const palette =
    kind === "success"
      ? "bg-green-50 border-green-100 text-green-700"
      : "bg-red-50 border-red-100 text-red-700";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${palette}`}
    >
      {kind === "success" ? (
        <svg
          className="mt-0.5 shrink-0"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          className="mt-0.5 shrink-0"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <span className="leading-snug">{message}</span>
    </div>
  );
}
