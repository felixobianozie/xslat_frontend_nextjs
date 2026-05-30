import Link from "next/link";

function BackLink() {
  return (
    <Link
      href="/about"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-white transition-colors"
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
      Back to About
    </Link>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0d9488"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="text-slate-600 text-sm leading-snug">{children}</span>
    </div>
  );
}

function NoteItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-indigo-100 last:border-0">
      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="text-slate-600 text-sm leading-snug">{children}</span>
    </div>
  );
}

export default function ProspectusPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #134e4a 0%, #0f766e 55%, #065f46 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-300/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-teal-300 mb-3">
              Day &amp; Boarding
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Student Prospectus
            </h1>
            <p className="text-teal-100 text-lg leading-relaxed">
              Everything a new or returning student needs to bring before
              resumption, from the day student checklist to the full boarding
              requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-12 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
            📋
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-1">
              Read before resumption
            </h4>
            <p className="text-amber-700 text-sm leading-relaxed">
              All students and parents/guardians are required to carefully
              review this prospectus before resumption day. Students who arrive
              without the required items may be turned back or restricted from
              taking up their place.
            </p>
          </div>
        </div>

        {/* Day students */}
        <div className="mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-teal-600 mb-3">
            Type A
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Day Students
          </h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-teal-600 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-lg">
                🌤
              </div>
              <span className="text-white font-semibold text-sm">
                Required items, Day Students
              </span>
            </div>
            <div className="px-6 py-4">
              <CheckItem>
                Complete set of school uniforms{" "}
                <span className="text-teal-600 text-xs">
                  (see Uniforms section for details)
                </span>
              </CheckItem>
              <CheckItem>Class locker with padlock</CheckItem>
              <CheckItem>Exercise books for all subjects offered</CheckItem>
              <CheckItem>
                Compulsory English Language and Mathematics textbooks
              </CheckItem>
            </div>
          </div>
        </div>

        {/* Boarding students */}
        <div className="mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 mb-3">
            Type B
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Boarding Students
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Boarding students are the first-class citizens of the Luthisco
            Republic. In addition to the day student requirements, they must
            arrive with the following:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Clothing & Bedding */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3 flex items-center gap-2">
                <span className="text-white text-lg">👔</span>
                <span className="text-white font-semibold text-sm">
                  Clothing &amp; Bedding
                </span>
              </div>
              <div className="px-5 py-3">
                <NoteItem>Complete set of school uniforms</NoteItem>
                <NoteItem>2 white bed sheets; 2 white pillow cases</NoteItem>
                <NoteItem>
                  2 sky-blue bed sheets; 2 sky-blue pillow cases
                </NoteItem>
                <NoteItem>1 blanket; 1 loin cloth</NoteItem>
                <NoteItem>1 mattress (student size) and pillow</NoteItem>
                <NoteItem>1 mosquito net</NoteItem>
                <NoteItem>1 towel; 1 soap dish; 1 bathing sponge</NoteItem>
              </div>
            </div>

            {/* Lockers & Tools */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-indigo-700 px-5 py-3 flex items-center gap-2">
                <span className="text-white text-lg">🔒</span>
                <span className="text-white font-semibold text-sm">
                  Lockers &amp; Tools
                </span>
              </div>
              <div className="px-5 py-3">
                <NoteItem>Class locker with padlock</NoteItem>
                <NoteItem>Dormitory locker with padlock</NoteItem>
                <NoteItem>2 cutlasses (boys and girls)</NoteItem>
                <NoteItem>
                  2 big-sized brooms (boys and girls, termly requirement)
                </NoteItem>
                <NoteItem>1 weeding hoe (girls only)</NoteItem>
                <NoteItem>1 battery lamp (rechargeable preferred)</NoteItem>
                <NoteItem>
                  1 box iron with some charcoal{" "}
                  <span className="text-slate-400 text-xs">(optional)</span>
                </NoteItem>
              </div>
            </div>

            {/* Dining */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-teal-700 px-5 py-3 flex items-center gap-2">
                <span className="text-white text-lg">🍽️</span>
                <span className="text-white font-semibold text-sm">
                  Dining Ware
                </span>
              </div>
              <div className="px-5 py-3">
                <NoteItem>
                  A set of cutleries: knife, fork, spoons and drinking cup
                </NoteItem>
                <NoteItem>1 flat plate (aluminium/silver)</NoteItem>
                <NoteItem>1 soup/bowl plate (aluminium/silver)</NoteItem>
                <NoteItem>1 bucket</NoteItem>
                <NoteItem>1 plastic water jar (preferably 10 litres)</NoteItem>
              </div>
            </div>

            {/* Essentials & Levies */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-teal-700 px-5 py-3 flex items-center gap-2">
                <span className="text-white text-lg">📦</span>
                <span className="text-white font-semibold text-sm">
                  Essentials &amp; Levies
                </span>
              </div>
              <div className="px-5 py-3">
                <NoteItem>1 Revised Standard Bible</NoteItem>
                <NoteItem>1 Dettol</NoteItem>
                <NoteItem>Jik, 1 litre</NoteItem>
                <NoteItem>Izal, 1 litre</NoteItem>
                <NoteItem>₦1,000 House Dues</NoteItem>
                <NoteItem>₦1,000 Termly Haircut Levy</NoteItem>
              </div>
            </div>
          </div>
        </div>

        {/* Important note */}
        <div className="bg-indigo-950 rounded-2xl p-6 mb-8 text-white">
          <h4 className="font-bold text-amber-300 text-sm mb-3 uppercase tracking-wide">
            Important Note
          </h4>
          <p className="text-indigo-200 text-sm leading-relaxed">
            <strong className="text-white">Jik, Izal and House Dues</strong> are
            to be handed over directly to the boarding officer for collective
            school use. All other items are for the student's personal use.
            Please do not share or distribute required cleaning materials with
            other students.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/uniforms"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: School Uniforms
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
