interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color: "violet" | "blue" | "emerald" | "amber";
}

const colorMap = {
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    trend: "text-violet-600",
    bar: "bg-violet-500",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    trend: "text-blue-600",
    bar: "bg-blue-500",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    trend: "text-emerald-600",
    bar: "bg-emerald-500",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    trend: "text-amber-600",
    bar: "bg-amber-500",
  },
};

export default function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  color,
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0 ${c.icon}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <p
            className={`text-xs font-medium mt-1 ${trend.positive ? "text-emerald-500" : "text-rose-500"}`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
