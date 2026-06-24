"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Rightbar.tsx
//
// Slim right-hand side rail shown on lg+ screens. Hosts the notification,
// profile, and logout shortcuts that mirror the mobile-only buttons in the
// Topbar.
//
// Notification + profile shortcuts have no backend yet — both fire the
// standard "feature in the works" toast.
// The logout button opens a confirmation modal and signs the user out
// (see Logoutbutton.tsx).
// ─────────────────────────────────────────────────────────────────────────────

import { Bell, User } from "lucide-react";
import { toast } from "react-toastify";

import LogoutButton from "./Logoutbutton";

const FEATURE_IN_WORKS = "This feature is currently in the works.";

export default function Rightbar() {
  const handlePlaceholder = () => toast.info(FEATURE_IN_WORKS);

  return (
    <aside className="h-full w-16 hidden lg:flex lg:flex-col">
      <nav className="h-2/3 my-auto border border-indigo-300 rounded-l-xl flex flex-col gap-4 py-5">
        {/* Notifications — placeholder (no backend yet). */}
        <button
          onClick={handlePlaceholder}
          aria-label="Notifications"
          className="cursor-pointer p-2 w-fit border border-indigo-300 rounded-md hover:bg-indigo-200 mx-auto block relative text-black"
        >
          <Bell size={13} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Profile — placeholder (no backend yet). */}
        <button
          onClick={handlePlaceholder}
          aria-label="Profile"
          className="cursor-pointer p-2 w-fit border border-indigo-300 rounded-md hover:bg-indigo-200 mx-auto block text-black"
        >
          <User size={13} />
        </button>

        {/* Logout — sits directly after the profile button, mirroring the
            Topbar order. Same visual treatment as the other Rightbar icons
            (bordered square, hover bg-indigo-200, 13px icon). */}
        <LogoutButton
          className="p-2 w-fit border border-indigo-300 rounded-md hover:bg-indigo-200 mx-auto block text-black"
          iconSize={13}
        />
      </nav>
    </aside>
  );
}
