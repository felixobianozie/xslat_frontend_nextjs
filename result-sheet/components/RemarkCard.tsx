// A teacher's or supervisor's remark card.

export default function RemarkCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sm border border-slate-300 bg-slate-50 p-2.5">
      <p className="mb-1 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-slate-700">
        {title}
      </p>
      <p className="text-[10px] italic leading-snug text-slate-800">
        {body ? (
          `"${body}"`
        ) : (
          <span className="not-italic text-slate-400">No remark provided.</span>
        )}
      </p>
    </div>
  );
}
