"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/components/Overlay.tsx
//
// A full-screen layer for the fees dialogs and side panel. It is drawn on top
// of everything through a portal, dims the page, stops the page behind it from
// scrolling, and closes on Escape or a click on the dimmed area. When it
// closes, focus goes back to the button that opened it.
//
// "centre" is a dialog, and "side" is a panel that stands at the right edge on
// large screens. On a phone both are a sheet that rises from the bottom.
// ─────────────────────────────────────────

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface OverlayProps {
  onClose: () => void;
  /** The id of the element that holds the dialog's title. */
  labelledBy: string;
  placement: "centre" | "side";
  children: ReactNode;
}

const LAYOUT = {
  centre: {
    wrapper: "items-end justify-center sm:items-center sm:p-4",
    panel: "sm:max-w-lg rounded-t-3xl sm:rounded-2xl",
    handle: "sm:hidden",
  },
  side: {
    wrapper: "items-end justify-center lg:items-stretch lg:justify-end",
    panel: "lg:max-w-md lg:h-full lg:max-h-none rounded-t-3xl lg:rounded-none lg:rounded-l-3xl",
    handle: "lg:hidden",
  },
};

export default function Overlay({
  onClose,
  labelledBy,
  placement,
  children,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const layout = LAYOUT[placement];

  // Always call the latest onClose, without restarting the effect below.
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div className={`fixed inset-0 z-9999 flex ${layout.wrapper}`}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-900/40 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl outline-none ${layout.panel}`}
      >
        <div
          className={`mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-200 ${layout.handle}`}
          aria-hidden="true"
        />
        {children}
      </div>
    </div>,
    document.body,
  );
}
