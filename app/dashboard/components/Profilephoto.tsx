"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Profilephoto.tsx
//
// The photo spot at the top of a profile: a soft round placeholder with the
// person's initials (a person icon when there is no name yet) and a small
// camera button on its corner.
//
// Photos are not built yet, so the camera button only shows the standard
// "feature in the works" message. When photo upload exists, this is the one
// place to change: the placeholder becomes the image and the button opens the
// upload.
// ─────────────────────────────────────────────────────────────────────────────

import { Camera, User } from "lucide-react";
import { toast } from "react-toastify";

const FEATURE_IN_WORKS = "This feature is currently in the works.";

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function ProfilePhoto({ name }: { name: string }) {
  const initials = initialsOf(name);

  return (
    <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
      <div
        aria-hidden="true"
        className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-violet-100 to-indigo-100 text-2xl font-bold text-violet-600 shadow-sm ring-4 ring-white sm:text-3xl"
      >
        {initials || <User size={36} className="text-violet-400" />}
      </div>

      <button
        type="button"
        onClick={() => toast.info(FEATURE_IN_WORKS)}
        aria-label="Change profile photo"
        title="Change photo"
        className="cursor-pointer absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow ring-2 ring-white transition-colors hover:bg-violet-700"
      >
        <Camera size={14} />
      </button>
    </div>
  );
}
