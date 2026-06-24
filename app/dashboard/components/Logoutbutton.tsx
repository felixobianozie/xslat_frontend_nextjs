"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Logoutbutton.tsx
//
// Reusable logout control. Renders the trigger icon button and, when clicked,
// shows a confirmation modal. Confirming calls NextAuth's signOut() with a
// redirect to /login — the same pattern used by the auth-failure fallback in
// Useclientauthfetch.ts, so the post-logout destination is consistent.
//
// Used by both Topbar (mobile) and Rightbar (lg+) — pass `className` and
// `iconSize` so the trigger button matches each bar's existing visual style.
//
// The ConfirmModal at the bottom mirrors the private one in Profilerequests:
// fixed full-screen backdrop, click-outside cancels, stable button width via
// the invisible label + absolutely-positioned loader pattern.
//
// Portal note:
//  The modal is rendered into document.body via createPortal. This matters
//  because the Topbar (which hosts the mobile LogoutButton) has
//  `backdrop-blur-md` on its <header>. The CSS `backdrop-filter` property
//  creates a containing block for fixed-positioned descendants, so without
//  the portal the modal's `fixed inset-0` would be bounded by the 64px-tall
//  header instead of the viewport — leaving the dialog stuck near the top of
//  the screen on mobile. Portalling to <body> escapes that containing block
//  and lets the modal center against the actual viewport on every screen
//  size. Same pattern used by Broadsheetsubmitmodal and Armactionmenu.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import ButtonLoader from "./Buttonloader";

interface LogoutButtonProps {
  /**
   * Tailwind classes for the trigger button. Each bar passes the same
   * classes its other icon buttons use so logout sits visually inline
   * with Bell / User / etc.
   */
  className?: string;
  /** Icon size — defaults to 18 (Topbar). Pass 13 for the Rightbar rail. */
  iconSize?: number;
}

export default function LogoutButton({
  className = "",
  iconSize = 18,
}: LogoutButtonProps) {
  // Controls whether the confirmation modal is visible.
  const [isOpen, setIsOpen] = useState(false);
  // Tracks the in-flight signOut so the modal stays mounted and disables
  // its buttons while the redirect is being arranged.
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    // signOut clears the NextAuth session and redirects to /login. Even if
    // the network call is slow, the loading state prevents double-clicks.
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Log out"
        className={className}
      >
        <LogOut size={iconSize} />
      </button>

      {/*
        Render the modal in a portal so it lives directly under <body>.
        This escapes the Topbar's backdrop-blur containing block (see the
        file-level "Portal note" above), guaranteeing the modal is centered
        against the actual viewport on both mobile and desktop.

        `isOpen` starts as false and only flips to true after a user click,
        so `document` is never touched during server rendering — no SSR
        guard needed, matching the codebase's existing portal usage.
      */}
      {isOpen &&
        createPortal(
          <ConfirmModal
            isLoading={isLoggingOut}
            onConfirm={handleConfirm}
            onCancel={() => {
              // Block dismissal while signOut is in flight — clicking the
              // backdrop or Cancel should be a no-op until the redirect happens.
              if (!isLoggingOut) setIsOpen(false);
            }}
          />,
          document.body,
        )}
    </>
  );
}

// ── ConfirmModal ───────────────────────────────────────────────────────────
// Private to this file — matches the modal pattern used by Profilerequests
// so the visual language of confirmation dialogs stays consistent.

interface ConfirmModalProps {
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ isLoading, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    // Backdrop — fixed, full-screen, dims content behind the modal.
    // Clicking the backdrop cancels (unless the mutation is in flight).
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      {/* Card — stop clicks from bubbling to the backdrop. */}
      <div
        className="relative w-full max-w-md mx-4 bg-indigo-50 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-slate-800 text-base">Log out?</h3>

        <p className="mt-3 mb-6 text-sm text-slate-600 leading-relaxed">
          You&apos;ll need to sign in again to access your dashboard.
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          {/* Confirm — stable width via invisible placeholder pattern */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="cursor-pointer relative flex items-center justify-center px-4 py-2 text-xs rounded-xl disabled:opacity-70 transition-colors bg-red-600 hover:bg-red-700 text-white"
          >
            <span className={isLoading ? "invisible" : ""}>Log out</span>
            <span
              className={`absolute inset-0 flex items-center justify-center ${
                isLoading ? "" : "invisible"
              }`}
            >
              <ButtonLoader />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
