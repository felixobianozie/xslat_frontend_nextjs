// ─────────────────────────────────────────────────────────────────────────────
// __fixtures__/mock-result.ts
//
// A realistic StudentResultResponse for local template testing.
//
// Use it while the backend CheckStudentResultView extension is still in
// flight. Import from anywhere in the /results feature to preview the
// templates without hitting the network:
//
//   // temporary test in app/results/page.tsx:
//   // import { MOCK_RESULT } from "./__fixtures__/mock-result";
//   // ...
//   // <ResultsPreview result={MOCK_RESULT} />
//
// DELETE this file once the backend response is live and verified.
// It's kept as a plain constant (no factory helper) so the shape stays
// obvious at a glance and matches what a real response looks like on the
// wire.
// ─────────────────────────────────────────────────────────────────────────────

import type { StudentResultResponse } from "./results";

export const MOCK_RESULT: StudentResultResponse = {
  class_average: 65.42,
  student_population: 32,

  assessment_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  student_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  student_public_id: "LHS/2023/0042",
  student_first_name: "Victor",
  student_middle_name: "Effiong",
  student_last_name: "Asuquo",
  student_gender: "M",

  total_score: 1032,
  total_score_obtainable: 1400,
  subject_count: 14,
  average: 73.71,
  position: 3,
  decision: "Pass",

  subjects: {
    s1: {
      subject_id: "s1",
      subject_definition_id: "d1",
      subject_name: "Mathematics",
      subject_abbr: "MTH",
      display_order: 1,
      scores: [25, 61],
      total: 86,
      grade_symbol: "A",
      remark: "Distinction",
    },
    s7: {
      subject_id: "s7",
      subject_definition_id: "d1",
      subject_name: "Mathematics",
      subject_abbr: "MTH",
      display_order: 1,
      scores: [25, 61],
      total: 86,
      grade_symbol: "A",
      remark: "Distinction",
    },
    s6: {
      subject_id: "s6",
      subject_definition_id: "d1",
      subject_name: "Mathematics",
      subject_abbr: "MTH",
      display_order: 1,
      scores: [25, 61],
      total: 86,
      grade_symbol: "A",
      remark: "Distinction",
    },
    s5: {
      subject_id: "s5",
      subject_definition_id: "d1",
      subject_name: "Mathematics",
      subject_abbr: "MTH",
      display_order: 1,
      scores: [25, 61],
      total: 86,
      grade_symbol: "A",
      remark: "Distinction",
    },
    s2: {
      subject_id: "s2",
      subject_definition_id: "d2",
      subject_name: "English Language",
      subject_abbr: "ENG",
      display_order: 2,
      scores: [22, 55],
      total: 77,
      grade_symbol: "B",
      remark: "Merit",
    },
    s3: {
      subject_id: "s3",
      subject_definition_id: "d3",
      subject_name: "Basic Technology",
      subject_abbr: "BTC",
      display_order: 3,
      scores: [12, 30],
      total: 42,
      grade_symbol: "F",
      remark: "Fail",
    },
  },

  grading_summary: { A: 1, B: 1, C: 0, F: 1 },

  behaviours: {
    b1: {
      trait_id: "b1",
      trait_name: "Punctuality",
      display_order: 1,
      max_score: 100,
      score: 88,
      grade_symbol: "A",
      remark: "Excellent",
      is_absent: false,
    },
    b2: {
      trait_id: "b2",
      trait_name: "Neatness",
      display_order: 2,
      max_score: 100,
      score: 75,
      grade_symbol: "B",
      remark: "Very Good",
      is_absent: false,
    },
    b3: {
      trait_id: "b3",
      trait_name: "Politeness",
      display_order: 3,
      max_score: 100,
      score: 60,
      grade_symbol: "C",
      remark: "Good",
      is_absent: false,
    },
    b4: {
      trait_id: "b4",
      trait_name: "Honesty",
      display_order: 4,
      max_score: 100,
      score: 85,
      grade_symbol: "A",
      remark: "Excellent",
      is_absent: false,
    },
  },

  skills: {
    sk1: {
      trait_id: "sk1",
      trait_name: "Handwriting",
      display_order: 1,
      max_score: 100,
      score: 82,
      grade_symbol: "A",
      remark: "Excellent",
      is_absent: false,
    },
    sk2: {
      trait_id: "sk2",
      trait_name: "Sports",
      display_order: 2,
      max_score: 100,
      score: 70,
      grade_symbol: "B",
      remark: "Very Good",
      is_absent: false,
    },
    sk3: {
      trait_id: "sk3",
      trait_name: "Musical Skills",
      display_order: 3,
      max_score: 100,
      score: 55,
      grade_symbol: "C",
      remark: "Good",
      is_absent: false,
    },
  },

  teachers_remark:
    "Victor has shown exceptional dedication this term. His consistent " +
    "performance across the sciences and languages is commendable. Keep it up!",
  supervisors_remark:
    "An outstanding result. Victor is encouraged to sustain this excellent " +
    "standard and continue to be a role model to his peers.",

  arm: {
    id: "arm-uuid",
    name: "A",
    abbr: "A",
    cognitive_assessment_format: {
      id: "cog-fmt",
      name: "Standard CA + Exam",
      units: [
        {
          id: "u1",
          name: "Class Work",
          abbr: "CW",
          max_score: 30,
          display_order: 1,
        },
        {
          id: "u2",
          name: "Term Exam",
          abbr: "EXM",
          max_score: 70,
          display_order: 2,
        },
      ],
    },
    cog_grading_format: {
      id: "cog-grade",
      name: "WAEC Style",
      low: 0,
      high: 100,
      grades: [
        {
          id: "g1",
          low: 80,
          high: 100,
          symbol: "A",
          remark: "Distinction",
          passed: true,
        },
        {
          id: "g2",
          low: 60,
          high: 79,
          symbol: "B",
          remark: "Merit",
          passed: true,
        },
        {
          id: "g3",
          low: 50,
          high: 59,
          symbol: "C",
          remark: "Pass",
          passed: true,
        },
        {
          id: "g4",
          low: 0,
          high: 49,
          symbol: "F",
          remark: "Fail",
          passed: false,
        },
      ],
    },
    aff_grading_format: {
      id: "aff-grade",
      name: "Affective 5-band",
      low: 0,
      high: 100,
      grades: [
        {
          id: "ag1",
          low: 80,
          high: 100,
          symbol: "A",
          remark: "Excellent",
          passed: true,
        },
        {
          id: "ag2",
          low: 60,
          high: 79,
          symbol: "B",
          remark: "Very Good",
          passed: true,
        },
        {
          id: "ag3",
          low: 50,
          high: 59,
          symbol: "C",
          remark: "Good",
          passed: true,
        },
        {
          id: "ag4",
          low: 40,
          high: 49,
          symbol: "D",
          remark: "Fair",
          passed: false,
        },
        {
          id: "ag5",
          low: 0,
          high: 39,
          symbol: "E",
          remark: "Poor",
          passed: false,
        },
      ],
    },
    psy_grading_format: {
      id: "psy-grade",
      name: "Psychomotor 5-band",
      low: 0,
      high: 100,
      grades: [
        {
          id: "pg1",
          low: 80,
          high: 100,
          symbol: "A",
          remark: "Excellent",
          passed: true,
        },
        {
          id: "pg2",
          low: 60,
          high: 79,
          symbol: "B",
          remark: "Very Good",
          passed: true,
        },
        {
          id: "pg3",
          low: 50,
          high: 59,
          symbol: "C",
          remark: "Good",
          passed: true,
        },
        {
          id: "pg4",
          low: 40,
          high: 49,
          symbol: "D",
          remark: "Fair",
          passed: false,
        },
        {
          id: "pg5",
          low: 0,
          high: 39,
          symbol: "E",
          remark: "Poor",
          passed: false,
        },
      ],
    },
    result_template: {
      id: "tpl-junior",
      name: "Terminal Report — Junior Secondary v2",
      template_key: "terminal-report-senior-secondary-v2",
      // template_key: "unknown",
      config: {},
    },
  },

  level: { id: "lvl", name: "Two", abbr: "2" },
  section: { id: "sec", name: "Junior Secondary School", abbr: "JSS" },
  term: { id: "trm", name: "First Term", abbr: "T1" },
  session: { id: "ses", name: "2024 / 2025", abbr: "24-25" },
  school: {
    id: "sch",
    name: "Lutheran High School, Obot Idim",
    abbr: "LHS",
    address: "P.M.B. 1001, Obot Idim",
    city: "Ibesikpo Asutan L.G.A.",
    lga: null,
    state: "Akwa Ibom State",
    country: "Nigeria",
  },
};
