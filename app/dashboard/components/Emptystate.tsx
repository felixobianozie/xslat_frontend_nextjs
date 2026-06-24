"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState.tsx  (shared / reusable)
//
// A polished empty-state block shown when a list has no results.
// Accepts optional title, description, and an illustration variant so the
// same component works across different list pages with an appropriate visual.
//
// Usage:
//   <EmptyState />                                     ← default (generic)
//   <EmptyState variant="staff" title="No staff found" description="…" />
//   <EmptyState variant="requests" />
// ─────────────────────────────────────────────────────────────────────────────

type EmptyStateVariant =
  | "generic"
  | "staff"
  | "requests"
  | "search"
  | "students";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
}

// ── Illustration components ────────────────────────────────────────────────

// Generic "empty box" — used when no specific variant is needed
function EmptyBoxIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-36 h-28"
    >
      {/* Shadow ellipse */}
      <ellipse cx="100" cy="148" rx="52" ry="8" fill="#E2E8F0" />
      {/* Box body */}
      <rect
        x="44"
        y="68"
        width="112"
        height="72"
        rx="10"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      {/* Box lid */}
      <path
        d="M40 76 L100 56 L160 76"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="#E8EEF6"
      />
      {/* Box lid top */}
      <path
        d="M40 76 L100 96 L160 76"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="#F8FAFC"
      />
      {/* Box open flap */}
      <path
        d="M76 64 L100 56 L124 64 L100 72 Z"
        fill="#DDE5F4"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Stars/sparkles */}
      <circle cx="60" cy="44" r="3" fill="#C4B5FD" opacity="0.7" />
      <circle cx="148" cy="36" r="4" fill="#A5B4FC" opacity="0.6" />
      <circle cx="38" cy="100" r="2.5" fill="#DDD6FE" opacity="0.8" />
      <path
        d="M136 50 L138 44 L140 50 L146 52 L140 54 L138 60 L136 54 L130 52 Z"
        fill="#DDD6FE"
        opacity="0.9"
      />
    </svg>
  );
}

// Staff-specific: silhouette of people
function StaffIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-36 h-28"
    >
      <ellipse cx="100" cy="150" rx="60" ry="8" fill="#E2E8F0" />
      {/* Left person */}
      <circle
        cx="62"
        cy="72"
        r="14"
        fill="#DDD6FE"
        stroke="#C4B5FD"
        strokeWidth="1.5"
      />
      <path
        d="M38 130 Q38 104 62 104 Q86 104 86 130"
        fill="#EDE9FE"
        stroke="#C4B5FD"
        strokeWidth="1.5"
      />
      {/* Center person (slightly taller / highlighted) */}
      <circle
        cx="100"
        cy="64"
        r="17"
        fill="#C4B5FD"
        stroke="#A78BFA"
        strokeWidth="1.5"
      />
      <path
        d="M72 130 Q72 98 100 98 Q128 98 128 130"
        fill="#DDD6FE"
        stroke="#A78BFA"
        strokeWidth="1.5"
      />
      {/* Right person */}
      <circle
        cx="138"
        cy="72"
        r="14"
        fill="#DDD6FE"
        stroke="#C4B5FD"
        strokeWidth="1.5"
      />
      <path
        d="M114 130 Q114 104 138 104 Q162 104 162 130"
        fill="#EDE9FE"
        stroke="#C4B5FD"
        strokeWidth="1.5"
      />
      {/* Question mark on center person */}
      <text
        x="94"
        y="69"
        fontSize="14"
        fontWeight="bold"
        fill="#7C3AED"
        fontFamily="serif"
      >
        ?
      </text>
    </svg>
  );
}

// Requests-specific: clipboard with a pending checkmark
function RequestsIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-36 h-28"
    >
      <ellipse cx="100" cy="150" rx="50" ry="7" fill="#E2E8F0" />
      {/* Clipboard */}
      <rect
        x="54"
        y="36"
        width="92"
        height="106"
        rx="10"
        fill="#F8FAFC"
        stroke="#CBD5E1"
        strokeWidth="2"
      />
      {/* Clip top */}
      <rect
        x="78"
        y="28"
        width="44"
        height="18"
        rx="9"
        fill="#E2E8F0"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      <rect x="86" y="32" width="28" height="10" rx="5" fill="#F1F5F9" />
      {/* Lines */}
      <rect x="68" y="68" width="64" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="68" y="84" width="48" height="5" rx="2.5" fill="#E2E8F0" />
      <rect x="68" y="100" width="56" height="5" rx="2.5" fill="#E2E8F0" />
      {/* Clock/pending badge */}
      <circle
        cx="148"
        cy="118"
        r="18"
        fill="#FEF3C7"
        stroke="#FDE68A"
        strokeWidth="2"
      />
      <circle cx="148" cy="118" r="2" fill="#F59E0B" />
      <line
        x1="148"
        y1="118"
        x2="148"
        y2="108"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="148"
        y1="118"
        x2="155"
        y2="118"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Search no-results
function SearchIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-36 h-28"
    >
      <ellipse cx="100" cy="150" rx="50" ry="7" fill="#E2E8F0" />
      {/* Magnifier */}
      <circle
        cx="88"
        cy="76"
        r="36"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="3"
      />
      <circle
        cx="88"
        cy="76"
        r="26"
        fill="#F8FAFC"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      {/* Handle */}
      <line
        x1="110"
        y1="98"
        x2="136"
        y2="124"
        stroke="#CBD5E1"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* X inside glass */}
      <line
        x1="79"
        y1="67"
        x2="97"
        y2="85"
        stroke="#C4B5FD"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="97"
        y1="67"
        x2="79"
        y2="85"
        stroke="#C4B5FD"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Students-specific: graduation cap resting on an open book
function StudentsIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-36 h-28"
    >
      <ellipse cx="100" cy="150" rx="55" ry="8" fill="#E2E8F0" />
      {/* Open book */}
      <path
        d="M36 108 Q36 88 60 84 L100 80 L140 84 Q164 88 164 108 L164 128 Q140 124 100 128 Q60 124 36 128 Z"
        fill="#EDE9FE"
        stroke="#C4B5FD"
        strokeWidth="1.5"
      />
      {/* Book spine */}
      <line
        x1="100"
        y1="80"
        x2="100"
        y2="128"
        stroke="#A78BFA"
        strokeWidth="2"
      />
      {/* Left page lines */}
      <line
        x1="52"
        y1="96"
        x2="90"
        y2="94"
        stroke="#C4B5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="52"
        y1="104"
        x2="90"
        y2="102"
        stroke="#C4B5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="52"
        y1="112"
        x2="90"
        y2="111"
        stroke="#DDD6FE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Right page lines */}
      <line
        x1="110"
        y1="94"
        x2="148"
        y2="96"
        stroke="#C4B5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="110"
        y1="102"
        x2="148"
        y2="104"
        stroke="#C4B5FD"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="110"
        y1="111"
        x2="148"
        y2="112"
        stroke="#DDD6FE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Graduation cap board */}
      <polygon
        points="100,42 148,62 100,82 52,62"
        fill="#A78BFA"
        stroke="#7C3AED"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Cap top */}
      <rect x="84" y="36" width="32" height="18" rx="3" fill="#7C3AED" />
      <rect x="84" y="36" width="32" height="6" rx="3" fill="#6D28D9" />
      {/* Tassel string */}
      <line
        x1="148"
        y1="62"
        x2="148"
        y2="82"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tassel bob */}
      <circle
        cx="148"
        cy="85"
        r="5"
        fill="#A78BFA"
        stroke="#7C3AED"
        strokeWidth="1.5"
      />
      {/* Sparkles */}
      <circle cx="40" cy="56" r="3" fill="#DDD6FE" opacity="0.8" />
      <circle cx="162" cy="48" r="4" fill="#C4B5FD" opacity="0.6" />
      <path
        d="M156 74 L158 68 L160 74 L166 76 L160 78 L158 84 L156 78 L150 76 Z"
        fill="#DDD6FE"
        opacity="0.9"
      />
    </svg>
  );
}

// Map variant → illustration + default text
const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  { illustration: React.ReactNode; title: string; description: string }
> = {
  generic: {
    illustration: <EmptyBoxIllustration />,
    title: "Nothing here yet",
    description: "No records to display at the moment.",
  },
  staff: {
    illustration: <StaffIllustration />,
    title: "No staff found",
    description: "Try adjusting your search or filter criteria.",
  },
  requests: {
    illustration: <RequestsIllustration />,
    title: "No profile requests",
    description: "New requests will appear here automatically.",
  },
  search: {
    illustration: <SearchIllustration />,
    title: "No results found",
    description: "We couldn't find anything matching your search.",
  },
  students: {
    illustration: <StudentsIllustration />,
    title: "No students found",
    description: "Enrolled students will appear here once added.",
  },
};

export default function EmptyState({
  variant = "generic",
  title,
  description,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      <div className="mb-5 opacity-90">{config.illustration}</div>

      {/* Title */}
      <p className="text-sm font-semibold text-slate-600 mb-1">
        {title ?? config.title}
      </p>

      {/* Description */}
      <p className="text-xs text-slate-400 max-w-60 leading-relaxed">
        {description ?? config.description}
      </p>
    </div>
  );
}
