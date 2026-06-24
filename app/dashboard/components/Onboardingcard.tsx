"use client";

import { CheckCircle2 } from "lucide-react";

interface OnboardingCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  completed?: boolean;
  /**
   * Label shown on the button when `completed` is true.
   * Defaults to "Done" so existing callers behave unchanged.
   * The verify-email/phone cards pass "Verified" here.
   */
  completedLabel?: string;
}

export default function OnboardingCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  completed = false,
  completedLabel = "Done",
}: OnboardingCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-300 h-full
        ${
          completed
            ? "bg-white border-violet-100 shadow-sm"
            : "bg-white border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md"
        }`}
    >
      {/* Completed badge */}
      {completed && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 size={20} className="text-green-700" />
        </div>
      )}

      {/* Icon area */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
          ${completed ? "bg-violet-50" : "bg-slate-50"}`}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-6">
        <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
      </div>

      {/* Action */}
      <button
        onClick={onAction}
        disabled={completed}
        className={`cursor-pointer w-full px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
          ${
            completed
              ? "bg-violet-50 text-violet-400 cursor-default"
              : "bg-violet-600 text-white hover:bg-violet-700 active:scale-95 shadow-md shadow-violet-200 hover:shadow-violet-300"
          }`}
      >
        {completed ? completedLabel : actionLabel}
      </button>
    </div>
  );
}
