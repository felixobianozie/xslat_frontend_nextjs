"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Configui.tsx
//
// Small presentational building blocks shared by every Configurations tab:
// text and select fields, a switch, a save button and notices. They use the same Tailwind classes as the existing
// create panels so the page looks like the rest of the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChangeEvent, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  PlusCircle,
  XCircle,
} from "lucide-react";

import ButtonLoader from "../../components/Buttonloader";

// ── Inputs ───────────────────────────────────────────────────────────────────

const INPUT_BASE =
  "w-full border rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";
const INPUT_OK =
  "border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
const INPUT_ERROR =
  "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100";

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  isValid?: boolean;
  className?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  isValid,
  className = "",
  children,
}: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
        {isValid && !error && (
          <CheckCircle2 size={12} className="text-emerald-500" />
        )}
        {error && <XCircle size={12} className="text-red-400" />}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
      )}
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "number" | "url" | "date";
  placeholder?: string;
  hint?: string;
  error?: string;
  isValid?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  hint,
  error,
  isValid,
  disabled,
  min,
  max,
  step,
  className,
}: TextFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      isValid={isValid}
      className={className}
    >
      <input
        id={id}
        name={id}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        className={`${INPUT_BASE} ${error ? INPUT_ERROR : INPUT_OK}`}
      />
    </FieldShell>
  );
}

interface SearchFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// A search box. The label is read by screen readers only.
export function SearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: SearchFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        className={`${INPUT_BASE} ${INPUT_OK}`}
      />
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  error?: string;
  disabled?: boolean;
  mono?: boolean;
  className?: string;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 4,
  hint,
  error,
  disabled,
  mono,
  className,
}: TextAreaFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_BASE} resize-y ${mono ? "font-mono" : ""} ${
          error ? INPUT_ERROR : INPUT_OK
        }`}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  hint,
  error,
  disabled,
  className,
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      {/* The chevron sits over the right edge of the select, which has its own
          arrow removed. It ignores clicks so the select still opens, and turns
          violet while the select has focus. */}
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`peer ${INPUT_BASE} appearance-none pr-9 cursor-pointer ${
            error ? INPUT_ERROR : `${INPUT_OK} hover:border-violet-300`
          }`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-colors peer-focus:text-violet-500 ${
            disabled ? "text-slate-300" : "text-slate-500"
          }`}
        />
      </div>
    </FieldShell>
  );
}

// ── Switch ───────────────────────────────────────────────────────────────────

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

// An on/off switch. The knob sits on the left when off and on the right when
// on, and the track turns from grey to violet.
//
// Position comes from flexbox only (no absolute positioning or transforms):
//   • `items-center` centres the knob vertically in the track.
//   • A spacer before the knob is 0 wide when off and one knob wide when on,
//     which pushes the knob across; its width transition makes it slide.
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-violet-600" : "bg-slate-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block h-5 shrink-0 transition-all duration-200 ease-in-out ${
          checked ? "w-5" : "w-0"
        }`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none block h-5 w-5 shrink-0 rounded-full bg-white shadow"
      />
    </button>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  // Shows a small dot beside the label while the value differs from what is saved.
  changed?: boolean;
  // Removes the vertical padding, for rows placed inside another layout.
  compact?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  changed,
  compact,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-6 ${compact ? "" : "py-4"}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">
          {label}
          {changed && (
            <span
              className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-violet-500 align-middle"
              title="Not saved yet"
            />
          )}
        </p>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        label={label}
        disabled={disabled}
      />
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

interface SaveButtonProps {
  label: string;
  onClick: () => void;
  isPending: boolean;
  disabled?: boolean;
}

export function SaveButton({
  label,
  onClick,
  isPending,
  disabled,
}: SaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isPending}
      className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
    >
      {/* The label stays in the layout so the button width does not jump. */}
      <span className={isPending ? "invisible" : ""}>{label}</span>
      <span
        className={`absolute inset-0 flex items-center justify-center ${
          isPending ? "" : "invisible"
        }`}
      >
        <ButtonLoader />
      </span>
    </button>
  );
}

// ── Notices ──────────────────────────────────────────────────────────────────

interface ErrorNoticeProps {
  message: string;
  onRetry?: () => void;
}

// Shown when a configuration query fails. The message comes from the backend,
// so a permission problem explains itself.
export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-4 text-center border border-slate-200 rounded-2xl bg-white">
      <AlertTriangle size={28} className="text-amber-500" />
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-slate-700">Could not load</p>
        <p className="text-xs text-slate-400 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// A notice shown above forms about how saving relates to results that are
// already submitted or approved.
export function PublicationNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function StatusPill({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-slate-100 text-slate-500 border border-slate-200"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

// ── List toolbar ─────────────────────────────────────────────────────────────

interface ListToolbarProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  // An optional second button, shown beside the main one with a plain look.
  secondaryLabel?: string;
  onSecondary?: () => void;
  // Further plain buttons, shown between the second button and the main one.
  extraActions?: { label: string; onClick: () => void }[];
}

const PLAIN_ACTION_CLASS =
  "cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 hover:text-violet-700 transition-colors";

// Heading row above each resource list, with an optional "create" button.
export function ListToolbar({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  extraActions,
}: ListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className={PLAIN_ACTION_CLASS}
          >
            <span>{secondaryLabel}</span>
          </button>
        )}
        {extraActions?.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={PLAIN_ACTION_CLASS}
          >
            <span>{action.label}</span>
          </button>
        ))}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
          >
            <PlusCircle size={12} />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
