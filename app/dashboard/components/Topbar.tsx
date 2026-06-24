"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Topbar.tsx
//
// Sticky header for the dashboard layout. Shows the school name, current
// term, a hamburger toggle on mobile, and bell/profile/logout buttons.
//
// Wiring notes:
//  * The current term label is fetched from school/detail/ and rendered as
//    "<term name> - <session name>" — matching the previous hardcoded
//    placeholder format. Cache key ["school", SCHOOL_ID] matches the key
//    used by other components (e.g. Studentassignarmpanel), so this is a
//    cache hit after the first request.
//  * The bell and profile buttons still have no backend, so they surface
//    the standard "feature in the works" toast.
//  * The logout button opens a confirmation modal; on confirm it calls
//    NextAuth's signOut() — see Logoutbutton.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import { Bell, Calendar, Menu, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useLeftbar } from "../context/Leftbarprovider";
import LogoutButton from "./Logoutbutton";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// Slice of the school/detail/ payload that this component actually uses.
// The full SchoolSerializer response has more fields — they are intentionally
// ignored here to keep the type narrow and self-documenting.
interface SchoolDetailEnvelope {
  message: string;
  data: {
    current_term: {
      id: string;
      name: string;
      abbr?: string;
      session: { id: string; name: string };
    } | null;
  };
}

interface TopbarProps {
  schoolName?: string;
}

export default function Topbar({
  schoolName = "Lutheran High School",
}: TopbarProps) {
  const { open } = useLeftbar();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Fetch school detail for the current-term label ───────────────────────
  const { data: schoolData, isLoading: schoolLoading } =
    useQuery<SchoolDetailEnvelope>({
      queryKey: ["school", SCHOOL_ID],
      queryFn: async () => {
        const { data, error } = await clientAuthFetch<SchoolDetailEnvelope>(
          `school/detail/?id=${SCHOOL_ID}`,
        );
        if (error) throw new Error(error.message);
        return data!;
      },
      enabled: !!SCHOOL_ID,
    });

  // Resolve the term label.
  //  * While loading: "Loading…"
  //  * Loaded with a current term:  "<term name> - <session name>"
  //    (matches the previous placeholder "Second Term - 2023/2024" format).
  //  * Loaded but no current term:  "No active term"
  const currentTerm = schoolData?.data.current_term ?? null;
  const termLabel = schoolLoading
    ? "Loading…"
    : currentTerm
      ? `${currentTerm.name} - ${currentTerm.session.name}`
      : "No active term";

  // Shared handler for the bell + profile placeholder buttons.
  const handlePlaceholder = () => toast.info(FEATURE_IN_WORKS);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border border-indigo-300 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
      {/* Left: hamburger + school name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={open}
          className="cursor-pointer lg:hidden p-2 rounded-xl hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          {/* School avatar */}
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
            >
              <path d="M16 4L2 11L16 18L30 11L16 4Z" fill="#7C3AED" />
              <path
                d="M6 14V22C6 22 10 26 16 26C22 26 26 22 26 22V14L16 19L6 14Z"
                fill="#A78BFA"
              />
              <rect x="28" y="11" width="2" height="10" rx="1" fill="#7C3AED" />
            </svg>
          </div>
          <span className="font-semibold text-slate-800 text-sm truncate hidden sm:block">
            {schoolName}
          </span>
        </div>
      </div>

      {/* Right: term + actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Current term chip — fed by school/detail/. Hidden on small screens
            to preserve room for the action buttons. */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-100">
          <Calendar size={13} />
          <span>{termLabel}</span>
        </div>

        {/* Notifications — placeholder (no backend yet). */}
        <button
          onClick={handlePlaceholder}
          aria-label="Notifications"
          className="cursor-pointer p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors relative lg:hidden"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Profile shortcut — placeholder (no backend yet). */}
        <button
          onClick={handlePlaceholder}
          aria-label="Profile"
          className="cursor-pointer p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors lg:hidden"
        >
          <User size={18} />
        </button>

        {/* Logout — placed directly after the profile button, mobile only.
            On lg+ the Rightbar hosts its own logout button. */}
        <LogoutButton
          className="p-2 rounded-xl hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors lg:hidden"
          iconSize={18}
        />
      </div>
    </header>
  );
}
