import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Announcement {
  id: string;
  title: string;
  date: string; // Display date e.g. "27th Feb, 2025"
  publishedBy: string;
  category: string; // e.g. "Fee Notice", "Newsletter", "General"
  body: string[]; // Each string is a paragraph or numbered point
}

interface TermGroup {
  termLabel: string; // e.g. "Second Term 2024/2025"
  termId: string; // anchor slug e.g. "term-2-2024-2025"
  announcements: Announcement[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
// To add a new announcement: add to the relevant term's array.
// To add a new term: add a new object to the array below.

const data: TermGroup[] = [
  {
    termLabel: "Second Term 2024/2025",
    termId: "term-2-2024-2025",
    announcements: [
      {
        id: "surcharge-mar-2025",
        title: "Payment of ₦3,000 Surcharge for All Boarding Students",
        date: "27th Feb, 2025",
        publishedBy: "Rev. Monday Jacob",
        category: "Fee Notice",
        body: [
          "Dear Parents/Guardians,",
          "This is a kind reminder that all boarders are required to come with the sum of ₦3,000 as a surcharge for damages to school property.",
          "We kindly ask for your compliance with this request on or before the next visiting day, scheduled for March 1, 2025.",
          "Your cooperation in ensuring a smooth process is highly appreciated.",
          "Thank you for your support.",
        ],
      },
      {
        id: "newsletter-feb-2025",
        title: "Newsletter — Second Term Mid-Term",
        date: "18th Feb, 2025",
        publishedBy: "Rev. Monday Jacob",
        category: "Newsletter",
        body: [
          "We thank God Almighty for seeing us throughout the first half of the Second Term of the 2024/2025 school year. We earnestly appreciate parents/guardians for their continued encouragement to us in the course of our service to God and humanity.",
          "To help us serve you better, we implore you to be active partners of this enterprise by adhering to the following information:",
          "1. Parents should endeavour to pay their outstanding fees before their wards return. (Boarders should not come back without complete payment).",
          "2. From next term day students should come with the following: 2 big toilet tissues, 1 medium size detergent.",
          "3. All boarders should come with the sum of ₦3,000 as surcharge for damages to school property before checking in.",
          "4. Extension class is compulsory for all SS3 and JS3 students and commences from 31st March to 25th April, 2025. Payment for JS3 Day students is ₦7,000 while boarders is ₦52,000; SS3 Day Students is ₦23,000 while boarders is ₦68,000. Account details: Opay, 8060206838, Iyakino Solomon Akpabio.",
          "5. Parents who have not paid their ward's NECO Registration fee are reminded to do so as the deadline will soon elapse.",
          "6. Parents of Boarders should treat their children for typhoid and malaria before returning them to the dormitory.",
          "7. Our school uniform dress code remains white from Monday to Thursday and blue on Fridays.",
          "8. 2025 graduation fees for SS3 students: ₦25,000 for graduands and ₦2,000 for other students.",
          "9. There will be a special meeting between SS3 parents and the Principal and Vice Principal Academic on Friday 14th March, 2025 — compulsory. Agenda: NECO payment, preparation for WAEC and JAMB, and general attitudes of SS3 students.",
          "10. Our pay points: Zenith Bank — Lutheran High School — 1011112061; Guaranty Trust Bank — Lutheran High School — 0107355105.",
          "Thank you.",
        ],
      },
      {
        id: "welcome-back-jan-2025",
        title: "Welcome Back to School!",
        date: "14th Jan, 2025",
        publishedBy: "Rev. Monday Jacob",
        category: "General",
        body: [
          "We are delighted to welcome all our students and stakeholders to a new term. Stay informed by following updates shared through our platforms and our official website: www.lutheranhighschool.ng",
          "Important Information:",
          "1. All academic activities, including teaching and learning, commenced fully on 14th January 2025.",
          "2. Parents are kindly urged to settle all outstanding and current fees. School fees for the second term: ₦35,000 for Day Students; ₦155,000 for Boarders. See the fees section for current payment channels and accounts.",
          "3. Boarders' Return: Boarders may return during weekdays from 2pm. This temporary arrangement is designed to streamline the return process.",
          "Feel free to raise valid questions or concerns through our Contact Us section; we will respond promptly.",
          "Thank you for your cooperation.",
        ],
      },
    ],
  },
  {
    termLabel: "First Term 2024/2025",
    termId: "term-1-2024-2025",
    announcements: [
      {
        id: "newsletter-dec-2024",
        title: "Newsletter — End of First Term",
        date: "12th Dec, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "Newsletter",
        body: [
          "Dear Valued Parents, we are delighted to see a hitch-free first term coming to an end on the 13th day of December, 2024. Please be informed of the following:",
          "1. Resumption: The school will re-open for second term on Tuesday 14th January, 2025. Academic activities will begin at resumption for all categories of students.",
          "2. Boarding Students: Boarders are expected back in school with evidence of fees payment on Monday 13th January, 2025 from 12:00pm to 5:00pm. Debtors will not be allowed into the boarding house.",
          "3. School Fees: Second term fees — ₦35,000 for day students and ₦155,000 for boarders.",
          "4. External Examinations: ₦40,000 for WAEC registration and ₦37,000 for NECO. Closing date for WAEC registration is 3rd January, 2025.",
          "5. Payment Terminal: The school has a POS machine at the Accounts Section. Come with your ATM card or visit our banks for cash deposits.",
          "6. Learning Materials: Parents are encouraged to equip their children with relevant textbooks, exercise books, mathematical sets, four-figure tables, periodic tables, and calculators where necessary.",
          "7. School Uniform: The school authority will be very strict on uniform from next term.",
          "8. Recurrent Student Requirements: Every student is expected to give two bundles of broom every term and a cutlass once in a session.",
          "9. School Account Details: Zenith Bank — Lutheran High School — 1011112061; GTBank — Lutheran High School — 0107355105.",
          "10. JAMB Classes: Preparatory classes for UTME candidates from 6th January 2025 to 4th April 2025. ₦10,000 for internal candidates and ₦15,000 for external candidates.",
          "Happy Christmas and Joyful New Year in Advance.",
        ],
      },
      {
        id: "public-notice-nov-2024",
        title: "Public Notice to Parents/Guardians",
        date: "18th Nov, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "General",
        body: [
          "Please take note of the following important information:",
          "1. Revision: Intensive revision sessions from Monday 18th to Friday 22nd November, 2024.",
          "2. First Term Examination: Monday 25th November to Wednesday 4th December, 2024.",
          "3. School Fees: Endeavour to pay up your ward's school fees to avoid restriction from the examination hall. Intensive fee drive starts Tuesday 19th November. Boarders who do not complete fees by Friday 22nd November will be sent home.",
          "4. Fee Clearance Card: Submit your ward's fee clearance card to the Bursar's office for validation. It will be used for admittance into the examination hall.",
          "5. Parents/Teachers Interaction Day: Friday 13th December, 2024 by 9am prompt at the school chapel. Mandatory for all parents and teachers.",
          "6. Christmas Carol: Friday 6th December, 2024 at the school chapel by 9:00am. Parents and guardians are warmly invited.",
          "We appreciate your continued understanding and cooperation.",
        ],
      },
      {
        id: "gtb-suspension-oct-2024",
        title: "Temporary Suspension of School's GTBank Account",
        date: "15th Oct, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "Fee Notice",
        body: [
          "This is to announce the temporary suspension of the use of our GTBank account. Please be guided not to use the account for any payment-related matter concerning the school until further notice.",
          "The current system upgrade is affecting transactions which in turn affects our smooth operations.",
        ],
      },
      {
        id: "public-notice-sept-2024",
        title: "Public Notice to Parents",
        date: "28th Sept, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "General",
        body: [
          "Please be notified of the following:",
          "1. School Lessons: Afternoon lessons and club activities commence on Monday 30th September, 2024.",
          "2. Pick-up Time: Pick-up time changes to 4pm for day students due to afternoon lessons and club activities.",
          "3. Independence Day: Public holiday on Tuesday 1st October, 2024. All school activities resume on Wednesday 2nd October, 2024.",
          "4. Uniform: Monday to Wednesday: white; Thursday: blue; Fridays: sports wear.",
          "5. Graduation Levy: Students in JSS2 to SS2 who have not paid the ₦2,000 graduation levy should do so to avoid embarrassment. Collection will be intensified from 30th September.",
          "6. First Continuous Assessment: commences Monday 7th October, 2024.",
          "7. School Gate closes by 8am. Please drop your ward(s) early.",
          "Thanks for always counting on us for the educational welfare of your children.",
        ],
      },
      {
        id: "resumption-aug-2024",
        title: "School Resumption — First Term 2024/2025 Session",
        date: "28th Aug, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "General",
        body: [
          "School resumes on 17th September 2024 for all students along with all academic activities (First Term, 2024/2025 academic session).",
          "Boarding students are expected to return to school on Sunday 15th September 2024 from 1pm to 5pm.",
          "Thank you.",
        ],
      },
    ],
  },
  {
    termLabel: "Third Term 2023/2024",
    termId: "term-3-2023-2024",
    announcements: [
      {
        id: "graduation-dresscode-2024",
        title: "2024 Graduation Dress Code",
        date: "8th Aug, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "General",
        body: [
          "To students only:",
          "This is to inform all non-graduating students that the official dress code to our 2024 graduation ceremony is the white school uniform. Anything less will be considered inappropriate.",
          "Exception: All SS2 students who are part of the protocol and ushering team are permitted to appear in white polo and jeans on graduation day.",
          "Thank you.",
        ],
      },
      {
        id: "third-term-results-2024",
        title: "Third Term Results — 2023/2024 Session",
        date: "7th Aug, 2024",
        publishedBy: "Administration",
        category: "Academic",
        body: [
          "Third term results for the 2023/2024 academic session will be issued to guardians and students on Tuesday, 13th August 2024 at the close of our graduation ceremony scheduled for the same day.",
          "We appreciate your understanding and count on your unending support.",
        ],
      },
      {
        id: "graduation-info-2024",
        title: "2024 Graduation Information",
        date: "7th Aug, 2024",
        publishedBy: "Mr. Owoidoho John",
        category: "Events",
        body: [
          "Please be informed that the graduation ceremony of our great school has been rescheduled as follows:",
          "1. Graduation eve activities will hold on Monday 12th August, 2024 by 3pm at the school premises.",
          "2. Graduation ceremony will hold on Tuesday 13th August, 2024 by 9am at the school premises.",
          "We hereby invite all our stakeholders to this memorable event.",
        ],
      },
    ],
  },
];

// ── Badge colour by category ──────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    "Fee Notice": "bg-rose-100 text-rose-700 border-rose-200",
    Newsletter: "bg-violet-100 text-violet-700 border-violet-200",
    General: "bg-slate-100 text-slate-600 border-slate-200",
    Academic: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Events: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const cls =
    styles[category] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cls}`}
    >
      {category}
    </span>
  );
}

// ── Back link ─────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      href="/notice"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-600 transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back to Notice Board
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Notice Board
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Announcements
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Official communications from school management — term newsletters,
              fee notices, policy updates, and important notices for parents,
              guardians, and students.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-12 max-w-4xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Term navigation tags */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
            Jump to Term
          </p>
          <div className="flex flex-wrap gap-2">
            {data.map((term) => (
              <a
                key={term.termId}
                href={`#${term.termId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200 shadow-sm"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
                </svg>
                {term.termLabel}
              </a>
            ))}
          </div>
        </div>

        {/* Announcement sections per term */}
        <div className="space-y-16">
          {data.map((term) => (
            <section key={term.termId} id={term.termId} className="scroll-mt-6">
              {/* Term heading */}
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                  {term.termLabel}
                </span>
              </div>

              {/* Announcement cards */}
              <div className="space-y-5">
                {term.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    {/* Card header */}
                    <div className="px-6 py-5 border-b border-slate-100">
                      <div className="flex flex-wrap items-start gap-3 mb-2">
                        <CategoryBadge category={item.category} />
                      </div>
                      <h3
                        className="font-bold text-indigo-950 text-base leading-snug mb-2"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        {/* Date */}
                        <span className="flex items-center gap-1.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {item.date}
                        </span>
                        {/* Publisher */}
                        <span className="flex items-center gap-1.5">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {item.publishedBy}
                        </span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-6 py-5 space-y-3">
                      {item.body.map((paragraph, i) => (
                        <p
                          key={i}
                          className="text-slate-600 text-sm leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 h-px bg-slate-200" />
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/notice/school-calendar"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            School Calendar
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
