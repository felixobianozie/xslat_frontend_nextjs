/**
 * Entrance Examination Results — 2026/2027 Academic Session
 *
 * HOW TO UPDATE THIS FILE:
 * 1. Each examination date is an object in the `examDates` array below.
 * 2. Under each date, candidates are grouped by class (e.g. "JS1", "SS1").
 * 3. To add a candidate, add an object { name, remarks } to the
 *    correct class array under the correct exam date.
 * 4. The page will automatically rebuild the tables and navigation tags.
 *
 * REMARKS GUIDE:
 *   "Admitted"          — candidate passed and is offered admission
 *   "Admitted (Boarder)"— candidate passed and is offered boarding admission
 *   "On Reserve List"   — candidate is on a waiting list
 *   ""                  — leave blank if no specific remark needed
 */

export type Candidate = {
  name: string;
  remarks: string;
};

export type ClassResult = {
  /** e.g. "JS 1", "JSS 2", "SS 1" */
  className: string;
  candidates: Candidate[];
};

export type ExamDate = {
  /** Used as a unique anchor ID, e.g. "july-26" */
  id: string;
  /** Display label, e.g. "Saturday, 26th July 2026" */
  label: string;
  classes: ClassResult[];
};

export type ResultData = {
  /** Displayed in the page heading, e.g. "2026/2027" */
  session: string;
  examDates: ExamDate[];
};

// ─────────────────────────────────────────────
//  RESULT DATA — Edit below this line
// ─────────────────────────────────────────────

const data: ResultData = {
  session: "2026/2027",

  examDates: [
    // ── Exam Date 1 ──────────────────────────
    // Results will be added here after the examination is conducted.
    // Example structure (uncomment and fill in when ready):
    //
    // {
    //   id: "july-26",
    //   label: "Saturday, 26th July 2026",
    //   classes: [
    //     {
    //       className: "JS 1",
    //       candidates: [
    //         { name: "Full Name Here", remarks: "Admitted" },
    //       ],
    //     },
    //   ],
    // },
  ],
};

export default data;
