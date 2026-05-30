/**
 * Entrance Examination Results — 2025/2026 Academic Session
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
  /** Used as a unique anchor ID, e.g. "july-27" */
  id: string;
  /** Display label, e.g. "Saturday, 27th July 2025" */
  label: string;
  classes: ClassResult[];
};

export type ResultData = {
  /** Displayed in the page heading, e.g. "2025/2026" */
  session: string;
  examDates: ExamDate[];
};

// ─────────────────────────────────────────────
//  RESULT DATA — Edit below this line
// ─────────────────────────────────────────────

const data: ResultData = {
  session: "2025/2026",

  examDates: [
    // ── Exam Date 1 ──────────────────────────
    {
      id: "july-26",
      label: "Saturday, 26th July 2025",
      classes: [
        {
          className: "JS 1",
          candidates: [
            { name: "Abasiakara Udo Ntuk", remarks: "Admitted" },
            { name: "Blessing Etim Okon", remarks: "Admitted (Boarder)" },
            { name: "Chinyere Ada Nwosu", remarks: "Admitted" },
            { name: "David Nsikan Bassey", remarks: "Admitted" },
            { name: "Ekanem Odudu Ekong", remarks: "On Reserve List" },
            { name: "Francis Asuquo Effiong", remarks: "Admitted" },
            { name: "Grace Mfon Udoh", remarks: "Admitted" },
          ],
        },
        {
          className: "JSS 2",
          candidates: [
            { name: "Henry Okokon Etim", remarks: "Admitted" },
            { name: "Imaenyin Okon Akpan", remarks: "Admitted" },
            { name: "Joy Uduak Inyang", remarks: "Admitted (Boarder)" },
          ],
        },
      ],
    },

    // ── Exam Date 2 ──────────────────────────
    {
      id: "aug-9",
      label: "Saturday, 9th August 2025",
      classes: [
        {
          className: "JS 1",
          candidates: [
            { name: "Kelechi Eze Amadi", remarks: "Admitted" },
            { name: "Lilian Essien Oyo", remarks: "Admitted" },
            { name: "Michael Idorenyin Okon", remarks: "Admitted" },
            { name: "Nse Asuquo Ekpo", remarks: "Admitted (Boarder)" },
            { name: "Obinna Chibuike Obi", remarks: "Admitted" },
          ],
        },
        {
          className: "SS 1",
          candidates: [
            { name: "Peace Aniefiok Udofia", remarks: "Admitted" },
            { name: "Queen Eka Udo", remarks: "Admitted" },
            {
              name: "Raymond Ndifreke Archibong",
              remarks: "Admitted (Boarder)",
            },
            { name: "Stella Akpabio Etuk", remarks: "Admitted" },
          ],
        },
        {
          className: "SS 2",
          candidates: [
            { name: "Thomas Edet Okon", remarks: "Admitted" },
            { name: "Uduak Nsikak Umoren", remarks: "Admitted" },
          ],
        },
      ],
    },
  ],
};

export default data;
