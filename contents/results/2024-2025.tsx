/**
 * Entrance Examination Results — 2024/2025 Academic Session
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
  /** Display label, e.g. "Saturday, 27th July 2024" */
  label: string;
  classes: ClassResult[];
};

export type ResultData = {
  /** Displayed in the page heading, e.g. "2024/2025" */
  session: string;
  examDates: ExamDate[];
};

// ─────────────────────────────────────────────
//  RESULT DATA — Edit below this line
// ─────────────────────────────────────────────

const data: ResultData = {
  session: "2024/2025",

  examDates: [
    // ── Exam Date 1 ──────────────────────────
    {
      id: "july-27",
      label: "Saturday, 27th July 2024",
      classes: [
        {
          className: "JS 1",
          candidates: [
            { name: "Abasiama Etim Inyang", remarks: "Admitted" },
            { name: "Blessing Okon Akpan", remarks: "Admitted" },
            { name: "Chukwuemeka Daniel Eze", remarks: "Admitted" },
            { name: "Favour Nsikak Udoh", remarks: "Admitted" },
            { name: "Gift Edet Bassey", remarks: "Admitted" },
            { name: "Imaobong Sunday Okon", remarks: "On Reserve List" },
            { name: "Joseph Akwaowo Effiong", remarks: "Admitted" },
            { name: "Kelechi Amadi Nwosu", remarks: "Admitted" },
          ],
        },
        {
          className: "JSS 2",
          candidates: [
            { name: "Abosede Mfon Udofia", remarks: "Admitted" },
            { name: "David Etim Okon", remarks: "Admitted" },
            { name: "Eka Asuquo Ekpo", remarks: "Admitted (Boarder)" },
            { name: "Frank Idorenyin Archibong", remarks: "Admitted" },
          ],
        },
      ],
    },

    // ── Exam Date 2 ──────────────────────────
    {
      id: "aug-10",
      label: "Saturday, 10th August 2024",
      classes: [
        {
          className: "JS 1",
          candidates: [
            { name: "Akpan Nse Edet", remarks: "Admitted" },
            { name: "Bassey Eno Udo", remarks: "Admitted (Boarder)" },
            { name: "Clara Obianuju Obi", remarks: "Admitted" },
            { name: "Daniel Okon Ekong", remarks: "Admitted" },
            { name: "Emediong Umoren Etim", remarks: "Admitted" },
            {
              name: "Faith Ndifreke Essien",
              remarks: "Probational arrangement",
            },
          ],
        },
        {
          className: "SS 1",
          candidates: [
            { name: "Grace Aniefiok Inyang", remarks: "Admitted" },
            { name: "Henry Otuekong Okon", remarks: "Admitted" },
            { name: "Ifeoma Chidinma Okeke", remarks: "Admitted (Boarder)" },
          ],
        },
      ],
    },

    // ── Exam Date 3 ──────────────────────────
    {
      id: "aug-17",
      label: "Saturday, 17th August 2024",
      classes: [
        {
          className: "JS 1",
          candidates: [
            { name: "Joy Akpabio Udoudo", remarks: "Admitted" },
            { name: "Kenneth Effiong Udo", remarks: "Admitted" },
            { name: "Lilian Ekemini Akpan", remarks: "Admitted" },
            { name: "Michael Nsikan Etuk", remarks: "Admitted (Boarder)" },
            { name: "Nse Okon Bassey", remarks: "Admitted" },
          ],
        },
        {
          className: "JSS 2",
          candidates: [
            { name: "Obinna Chibueze Okoro", remarks: "Admitted" },
            { name: "Peace Uduak Udofia", remarks: "Admitted" },
          ],
        },
        {
          className: "SS 2",
          candidates: [
            { name: "Queen Ekanem Okon", remarks: "Admitted" },
            { name: "Raymond Akpan Ekpo", remarks: "Admitted (Boarder)" },
            { name: "Stella Imaobong Ntuk", remarks: "Admitted" },
          ],
        },
      ],
    },
  ],
};

export default data;
