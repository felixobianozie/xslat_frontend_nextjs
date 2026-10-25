"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Dropdownpanel.tsx
//
// A panel that opens under a button and is never cut off by the page around
// it, so filter and sort menus stay whole on a short list.
//
// Why a portal: the lists sit inside a wrapper with `overflow-hidden` (it
// hides the list while a slide-in panel is open). A menu drawn inside that
// wrapper is clipped when the list is short. This panel is drawn straight
// into <body> instead and placed with viewport coordinates read from the
// button, so no ancestor can clip it.
//
// Placement:
//  - It opens below the button, or above it when there is little room below
//    and more above. Its height is capped to the room available and scrolls
//    inside itself.
//  - It lines up with the button's left edge (or right edge with
//    align="right"), and stays 8px inside the screen. It is never wider than
//    the screen, which matters on a phone.
//  - It follows the button while the page scrolls or resizes.
//
// It closes on Escape (focus returns to the button) and on a click outside
// both the panel and the button. The button's own click toggles it, so the
// caller keeps the `open` state.
//
// The only inline style is the position and size, which are measured numbers
// that Tailwind classes cannot express.
// ─────────────────────────────────────────────────────────────────────────────

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

// Pixels kept free at the screen edges.
const VIEWPORT_MARGIN = 8;
// Pixels between the button and the panel.
const GAP = 4;
// Below this much room under the button, the panel opens upward when there
// is more room above.
const MIN_SPACE_BELOW = 240;
// The panel is never made shorter than this, even in a very small window.
const MIN_HEIGHT = 120;

interface Placement {
  left: number;
  width: number;
  maxHeight: number;
  // Exactly one of the two is set: the panel hangs from `top`, or stands on
  // `bottom` when it opens upward.
  top?: number;
  bottom?: number;
}

function measure(
  anchor: HTMLElement,
  desiredWidth: number,
  align: "left" | "right",
): Placement {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(desiredWidth, viewportWidth - 2 * VIEWPORT_MARGIN);

  // Line up with the chosen edge of the button; if that runs off the right of
  // the screen, use the button's other edge, then keep inside the screen.
  let left = align === "right" ? rect.right - width : rect.left;
  if (left + width > viewportWidth - VIEWPORT_MARGIN) left = rect.right - width;
  left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(left, viewportWidth - VIEWPORT_MARGIN - width),
  );

  const spaceBelow = viewportHeight - rect.bottom - GAP - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;
  const opensUp = spaceBelow < MIN_SPACE_BELOW && spaceAbove > spaceBelow;

  return opensUp
    ? {
        left,
        width,
        maxHeight: Math.max(spaceAbove, MIN_HEIGHT),
        bottom: viewportHeight - rect.top + GAP,
      }
    : {
        left,
        width,
        maxHeight: Math.max(spaceBelow, MIN_HEIGHT),
        top: rect.bottom + GAP,
      };
}

interface DropdownPanelProps {
  open: boolean;
  onClose: () => void;
  /** The button the panel hangs from. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Preferred width in pixels. */
  width: number;
  align?: "left" | "right";
  /** "menu" for a list of actions, "dialog" for a panel of controls. */
  role?: "menu" | "dialog";
  label: string;
  children: ReactNode;
}

export default function DropdownPanel({
  open,
  onClose,
  anchorRef,
  width,
  align = "left",
  role = "menu",
  label,
  children,
}: DropdownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const reposition = useCallback(() => {
    if (anchorRef.current) {
      setPlacement(measure(anchorRef.current, width, align));
    }
  }, [anchorRef, width, align]);

  // Placed before the browser paints, so the panel never flashes at the
  // wrong spot.
  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  // Stay attached to the button while the page scrolls or resizes. The scroll
  // listener uses capture so a scrolling ancestor is caught too.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Close on a click outside the panel and the button, and on Escape.
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        anchorRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !placement) return null;

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      aria-label={label}
      style={{
        top: placement.top,
        bottom: placement.bottom,
        left: placement.left,
        width: placement.width,
        maxHeight: placement.maxHeight,
      }}
      className="fixed z-9999 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg"
    >
      {children}
    </div>,
    document.body,
  );
}
