export default function Loading() {
  return (
    <div className="h-screen px-4 md:px-6 lg:px-8 py-6 animate-pulse">
      <div className="h-6 w-40 rounded bg-slate-100" />
      <div className="mt-2 h-3 w-64 rounded bg-slate-100" />
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="h-24 bg-slate-100" />
        <div className="px-5 pb-6">
          <div className="-mt-12 h-24 w-24 rounded-full bg-slate-200 ring-4 ring-white" />
          <div className="mt-4 h-5 w-48 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl bg-slate-100" />
        <div className="h-56 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
