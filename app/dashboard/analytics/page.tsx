import AnalyticsStatsBar from "./components/Analyticsstatsbar";

// Server component: renders the static heading and delegates the live stat
// cards to a client component. The grid layout, stat-card styling, and the
// underlying StatCard component are unchanged from the original mock — only
// the data source moved from hardcoded values to backend queries.
export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Here&apos;s an overview of what&apos;s happening at Lutheran High
          School today.
        </p>
      </div>

      {/* Stat cards (client — fetches its own data via React Query) */}
      <AnalyticsStatsBar />
    </div>
  );
}
