// ─────────────────────────────────────────
// app/dashboard/fees/components/Studentavatar.tsx
//
// A round badge with a student's initials.
// ─────────────────────────────────────────

interface StudentAvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "lg";
}

export default function StudentAvatar({
  firstName,
  lastName,
  size = "sm",
}: StudentAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const sizeClasses = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs";

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700 ${sizeClasses}`}
    >
      {initials}
    </span>
  );
}
