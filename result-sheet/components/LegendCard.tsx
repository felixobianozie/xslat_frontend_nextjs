import type { ResultGrade } from "../types";

// One grading legend: a grade's symbol, its score range and its remark.

export default function LegendCard({
  title,
  grades,
}: {
  title: string;
  grades: ResultGrade[];
}) {
  // Legends read best low-to-high (ascending). The API returns them in the
  // model's default ordering; we sort here to keep the visual consistent.
  const sortedGrades = [...grades].sort((a, b) => b.low - a.low);

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300">
      <div className="border-b border-slate-300 bg-slate-100 px-2 py-1">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-700">
          {title}
        </p>
      </div>
      <table className="w-full text-[8.5px]">
        <thead className="text-slate-500">
          <tr>
            <th className="px-1.5 py-0.5 text-left font-normal">Range</th>
            <th className="px-1.5 py-0.5 text-left font-normal">Remark</th>
            <th className="w-[8mm] px-1.5 py-0.5 text-right font-normal">
              Symbol
            </th>
          </tr>
        </thead>
        <tbody className="text-slate-800">
          {sortedGrades.length === 0 ? (
            <tr className="border-t border-slate-200">
              <td
                colSpan={3}
                className="px-1.5 py-1 text-center text-slate-400"
              >
                No grades configured.
              </td>
            </tr>
          ) : (
            sortedGrades.map((grade) => (
              <tr key={grade.id} className="border-t border-slate-200">
                <td className="px-1.5 py-0 text-slate-500">
                  {grade.low} – {grade.high}
                </td>
                <td
                  className={`px-1.5 py-0 ${
                    !grade.passed ? "text-rose-700" : ""
                  }`}
                >
                  {grade.remark}
                </td>
                <td
                  className={`px-1.5 py-0 text-right font-bold ${
                    !grade.passed ? "text-rose-700" : ""
                  }`}
                >
                  {grade.symbol}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
