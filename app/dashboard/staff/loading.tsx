// Next.js automatically renders this while the staff page is loading.
// Keeps the layout stable with a subtle pulsing skeleton.

import TableLoader from "../components/Tableloader";

export default function Loading() {
  return (
    <div className="h-screen px-4 md:px-6 lg:px-8 py-6 animate-pulse">
      <TableLoader rows={10} />
    </div>
  );
}
