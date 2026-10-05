"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Templatepreviewmodal.tsx
//
// A read-only gallery of every result template available to the school, opened
// from the Result template drop-down on the Arm Settings panel. Nothing can be
// changed or chosen here; it only helps the admin compare templates before
// picking one.
//
// Templates are split into two groups, switched with the tabs at the top:
//   School-only Templates  made for this school
//   Universal Templates    shared with every school
//
// Each group is a carousel that shows one template at a time: its preview
// image (or a "No Preview Available" placeholder), name, key, owner, status,
// the date it was added, its description and its settings. The settings are the
// template's free-form `config` object, shown as a list of labelled values.
// Move between templates with the Previous / Next buttons, the dots, or the
// left and right arrow keys; Escape closes the modal.
//
// The modal renders into document.body so the panel it is opened from cannot
// clip it or change its text colour. It is only mounted after a click, so
// document is always available.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
  X,
} from "lucide-react";

import type {
  ResultTemplateListItem,
  ResultTemplateScope,
} from "@/types/configurations";

// ── Groups ───────────────────────────────────────────────────────────────────

const GROUPS: {
  scope: ResultTemplateScope;
  label: string;
  description: string;
  emptyText: string;
}[] = [
  {
    scope: "school",
    label: "School-only Templates",
    description: "Made for your school and available only to it.",
    emptyText:
      "Your school has no templates of its own yet. Templates created for your school will appear here.",
  },
  {
    scope: "universal",
    label: "Universal Templates",
    description: "Shared with every school on the platform.",
    emptyText: "No universal templates are available right now.",
  },
];

// Past this many templates the dots would crowd the footer, so only the
// "n of total" counter is shown.
const MAX_DOTS = 8;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatAddedOn(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "show_attendance" becomes "Show attendance".
function humanizeKey(key: string): string {
  const text = key.replace(/[_-]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// One value from a template's config, shown in a form that suits its type.
function SettingValue({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
          value
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-100 text-slate-500"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-xs text-slate-400">—</span>;
  }
  if (typeof value === "string" || typeof value === "number") {
    return (
      <span className="wrap-break-word text-xs text-slate-800">{value}</span>
    );
  }
  if (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" || typeof item === "number")
  ) {
    return (
      <span className="wrap-break-word text-xs text-slate-800">
        {value.join(", ")}
      </span>
    );
  }
  // Nested objects and mixed lists are shown as compact JSON.
  return (
    <code className="break-all font-mono text-[11px] text-slate-600">
      {JSON.stringify(value)}
    </code>
  );
}

function Badge({ children, style }: { children: ReactNode; style: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}
    >
      {children}
    </span>
  );
}

// Shown when a template has no preview image, or the image could not load.
function NoPreview() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-linear-to-br from-slate-50 to-slate-100 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
        <ImageOff size={20} className="text-slate-400" />
      </div>
      <p className="text-xs font-medium text-slate-500">No Preview Available</p>
      <p className="text-[11px] leading-relaxed text-slate-400">
        A preview image has not been added for this template.
      </p>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface TemplatePreviewModalProps {
  /** Every template the school can see, as returned by result-template/list/. */
  templates: ResultTemplateListItem[];
  /** The template currently picked in the form. The modal opens on it. */
  selectedId: string;
  onClose: () => void;
}

export default function TemplatePreviewModal({
  templates,
  selectedId,
  onClose,
}: TemplatePreviewModalProps) {
  // Templates of each group, sorted by name so the order is predictable.
  const byScope = useMemo(() => {
    const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name));
    return {
      school: sorted.filter((template) => template.scope === "school"),
      universal: sorted.filter((template) => template.scope === "universal"),
    };
  }, [templates]);

  // Open on the selected template's group and position. Without a selection,
  // open on the first group that has templates.
  const [activeScope, setActiveScope] = useState<ResultTemplateScope>(() => {
    const selected = templates.find((template) => template.id === selectedId);
    if (selected) return selected.scope;
    return byScope.school.length > 0 || byScope.universal.length === 0
      ? "school"
      : "universal";
  });
  const [positions, setPositions] = useState<
    Record<ResultTemplateScope, number>
  >(() => ({
    school: Math.max(
      0,
      byScope.school.findIndex((t) => t.id === selectedId),
    ),
    universal: Math.max(
      0,
      byScope.universal.findIndex((t) => t.id === selectedId),
    ),
  }));
  // Templates whose preview image failed to load.
  const [failedImages, setFailedImages] = useState<string[]>([]);

  const group = GROUPS.find((item) => item.scope === activeScope)!;
  const items = byScope[activeScope];
  const position = Math.min(
    positions[activeScope],
    Math.max(items.length - 1, 0),
  );
  const template = items[position];
  // A response without these fields is treated as having no description and no
  // settings, so the modal still opens.
  const description = template?.description?.trim() ?? "";
  const settings = Object.entries(template?.config ?? {});

  // Moves by `step` templates, wrapping around at either end.
  function move(step: number) {
    if (items.length < 2) return;
    setPositions((previous) => ({
      ...previous,
      [activeScope]: (position + step + items.length) % items.length,
    }));
  }

  // Arrow keys move through the carousel and Escape closes the modal.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });

  const hasImage =
    !!template?.preview_image_url && !failedImages.includes(template.id);

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-preview-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-100 bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div>
            <h2
              id="template-preview-title"
              className="text-sm font-bold text-slate-800"
            >
              Result templates
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              A read-only look at every template available to your school.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Group tabs */}
        <div
          role="tablist"
          aria-label="Template groups"
          className="mt-3 flex gap-1 border-b border-slate-100 px-4 sm:px-5"
        >
          {GROUPS.map((item) => {
            const active = item.scope === activeScope;
            return (
              <button
                key={item.scope}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveScope(item.scope)}
                className={`cursor-pointer -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-violet-100 text-violet-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {byScope[item.scope].length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slide */}
        <div className="flex-1 overflow-y-auto">
          <p className="px-4 pt-4 text-[11px] text-slate-400 sm:px-5">
            {group.description}
          </p>

          {!template ? (
            <div className="px-4 py-12 text-center sm:px-5">
              <p className="mx-auto max-w-xs text-xs leading-relaxed text-slate-400">
                {group.emptyText}
              </p>
            </div>
          ) : (
            <div
              key={template.id}
              className="grid grid-cols-1 gap-5 p-4 opacity-100 transition-opacity duration-300 starting:opacity-0 sm:p-5 md:grid-cols-5"
            >
              {/* Preview */}
              <div className="md:col-span-2">
                <div className="relative mx-auto aspect-3/4 w-full max-w-64 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm md:mx-0 md:max-w-none">
                  {hasImage ? (
                    // Previews can be hosted on any domain, so a plain img is
                    // used instead of next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={template.preview_image_url}
                      alt={`Preview of the ${template.name} template`}
                      loading="lazy"
                      onError={() =>
                        setFailedImages((previous) => [
                          ...previous,
                          template.id,
                        ])
                      }
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <NoPreview />
                  )}
                </div>
                {hasImage && (
                  <a
                    href={template.preview_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-1 text-[11px] text-violet-600 hover:underline md:justify-start"
                  >
                    View full-size preview <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 md:col-span-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    style={
                      template.scope === "school"
                        ? "border-violet-100 bg-violet-50 text-violet-700"
                        : "border-sky-100 bg-sky-50 text-sky-700"
                    }
                  >
                    {template.scope === "school" ? "School-only" : "Universal"}
                  </Badge>
                  <Badge
                    style={
                      template.is_active
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    }
                  >
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {template.id === selectedId && (
                    <Badge style="border-violet-200 bg-white text-violet-600">
                      Selected in form
                    </Badge>
                  )}
                </div>

                <h3 className="mt-3 wrap-break-word text-lg font-semibold text-slate-900">
                  {template.name}
                </h3>

                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Template key
                    </dt>
                    <dd className="mt-0.5 break-all font-mono text-xs text-slate-700">
                      {template.template_key}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Available to
                    </dt>
                    <dd className="mt-0.5 text-xs text-slate-700">
                      {template.school ? template.school.name : "All schools"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Status
                    </dt>
                    <dd className="mt-0.5 text-xs text-slate-700">
                      {template.is_active ? "Active" : "Inactive"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Added
                    </dt>
                    <dd className="mt-0.5 text-xs text-slate-700">
                      {formatAddedOn(template.created_on)}
                    </dd>
                  </div>
                </dl>

                {/* Description */}
                <div className="mt-5">
                  <h4 className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Description
                  </h4>
                  {description ? (
                    <p className="mt-1 whitespace-pre-line wrap-break-word text-xs leading-relaxed text-slate-600">
                      {description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      No description has been added for this template.
                    </p>
                  )}
                </div>

                {/* Settings (the template's config) */}
                <div className="mt-5">
                  <h4 className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Settings
                  </h4>
                  {settings.length > 0 ? (
                    <dl className="mt-1.5 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                      {settings.map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between gap-3 px-3 py-2"
                        >
                          <dt className="text-[11px] text-slate-500">
                            {humanizeKey(key)}
                          </dt>
                          <dd className="min-w-0 text-right">
                            <SettingValue value={value} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      This template has no extra settings.
                    </p>
                  )}
                </div>

                {!template.is_active && (
                  <p className="mt-5 rounded-xl border border-yellow-100 bg-yellow-50 px-3 py-2 text-[11px] text-yellow-700">
                    This template is inactive, so it cannot be assigned to arms.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Carousel controls */}
        {items.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={items.length < 2}
              aria-label="Previous template"
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex flex-col items-center gap-1.5">
              {items.length > 1 && items.length <= MAX_DOTS && (
                <div className="flex items-center gap-1.5">
                  {items.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setPositions((previous) => ({
                          ...previous,
                          [activeScope]: index,
                        }))
                      }
                      aria-label={`Show ${item.name}`}
                      aria-current={index === position}
                      className={`cursor-pointer h-1.5 rounded-full transition-all ${
                        index === position
                          ? "w-5 bg-violet-600"
                          : "w-1.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-400">
                {position + 1} of {items.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => move(1)}
              disabled={items.length < 2}
              aria-label="Next template"
              className="cursor-pointer flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
