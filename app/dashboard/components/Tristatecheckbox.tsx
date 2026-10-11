"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Tristatecheckbox.tsx
//
// A checkbox that can also show a mixed state, for lists where the checkbox
// stands for several records at once: ticked means all of them, mixed means
// some of them, empty means none.
//
// The mixed state is only a display state. Clicking the box calls onChange as
// a normal checkbox does; the caller decides what a click on a mixed box
// means.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";

interface TriStateCheckboxProps {
  checked: boolean;
  // Shown only while `checked` is false.
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  // Names the box for screen readers when there is no visible label.
  ariaLabel?: string;
  className?: string;
}

export default function TriStateCheckbox({
  checked,
  indeterminate = false,
  onChange,
  disabled,
  ariaLabel,
  className = "",
}: TriStateCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mixed = indeterminate && !checked;

  // `indeterminate` is a DOM property with no HTML attribute, so it is set
  // from an effect.
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = mixed;
  }, [mixed]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={ariaLabel}
      aria-checked={mixed ? "mixed" : checked}
      className={`h-4 w-4 shrink-0 cursor-pointer accent-violet-600 disabled:cursor-not-allowed ${className}`}
    />
  );
}
