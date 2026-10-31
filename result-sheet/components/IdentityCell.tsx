// One label and value in the student information grid.

export default function IdentityCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`p-1.5 ${className}`}>
      <p className="text-[7px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}
