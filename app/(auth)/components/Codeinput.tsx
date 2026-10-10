// ─────────────────────────────────────────────────────────────────────────────
// Codeinput.tsx
//
// The 6-digit code field shared by the account verification form and the staff
// invitation form.
//
// It accepts digits only and stops at six characters, so a pasted code with
// spaces or dashes still ends up clean. It is centred and widely spaced so the
// digits are easy to read, and it asks phones to offer one-time-code autofill.
//
// The parent keeps the value and the error message; this component only draws
// the field and cleans what the user types.
// ─────────────────────────────────────────────────────────────────────────────

// A valid code is exactly six digits.
export const CODE_REGEX = /^\d{6}$/;

interface CodeInputProps {
  id?: string;
  value: string;
  /** Called with the cleaned value (digits only, at most six). */
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function CodeInput({
  id = "code",
  value,
  onChange,
  error,
  disabled = false,
}: CodeInputProps) {
  const base =
    "w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none transition-all bg-gray-50 placeholder:text-gray-400 border tracking-[0.4em] text-center font-semibold disabled:opacity-60 disabled:cursor-not-allowed";
  const stateClass = error
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
    : "border-gray-200 hover:border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider"
      >
        6-Digit Code <span className="text-violet-500">*</span>
      </label>
      <input
        id={id}
        name={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        maxLength={6}
        disabled={disabled}
        className={`${base} ${stateClass}`}
      />
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
