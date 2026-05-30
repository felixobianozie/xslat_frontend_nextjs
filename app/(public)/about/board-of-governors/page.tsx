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

function Initials({ name }: { name: string }) {
  const parts = name
    .replace(
      /^(Rev|Mr|Mrs|Dr|Deac|Pst|HRM|Prof|Engr|Air|DIG|Barr|Oba|Chief)\.\s*/i,
      "",
    )
    .split(" ");
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-700 to-violet-700 flex items-center justify-center text-white text-xl font-bold shrink-0 mx-auto">
      {initials}
    </div>
  );
}

const board = [
  {
    name: "Deac. Nse Asuquo",
    role: "Chairman, LSMB",
    description:
      "Leads the Lutheran School Management Board, providing strategic oversight and governance for Lutheran High School.",
  },
  {
    name: "Deac. Enobong Ekong",
    role: "Secretary, LSMB",
    description:
      "Responsible for the official records, communications, and administrative coordination of the board.",
  },
  {
    name: "Mr Felix Udoh",
    role: "Member, LSMB",
    description:
      "Contributes valuable expertise to board deliberations and the strategic development of the school.",
  },
  {
    name: "Mr Unyime Ekong",
    role: "Member, LSMB",
    description:
      "An active member supporting the board's mission to maintain LHS as a centre of academic excellence.",
  },
  {
    name: "Mr Chris Ekong",
    role: "Member, LSMB",
    description:
      "Plays a key role in board discussions on school welfare, infrastructure, and student development.",
  },
  {
    name: "Mrs Offiong Ekong",
    role: "Member, LSMB",
    description:
      "Brings a broad perspective to the board, with particular attention to the welfare of students and staff.",
  },
];

const responsibilities = [
  {
    icon: "📋",
    title: "Strategic Direction",
    desc: "The LSMB sets the long-term vision and strategic priorities for the school, ensuring LHS remains aligned with its Christian mission and academic mandate.",
  },
  {
    icon: "🏛️",
    title: "Governance & Oversight",
    desc: "The board ensures proper institutional governance, financial accountability, and compliance with regulatory standards at the state and national level.",
  },
  {
    icon: "🤝",
    title: "Stakeholder Engagement",
    desc: "The LSMB liaises with the Lutheran Church of Nigeria, the state Ministry of Education, parents, alumni, and the wider community to advance the school's interests.",
  },
  {
    icon: "📈",
    title: "Institutional Development",
    desc: "Board members champion infrastructure, curriculum enhancement, and welfare improvements, ensuring LHS continuously raises its standards.",
  },
];

export default function BoardOfGovernorsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e293b 0%, #0f172a 55%, #1e1b4b 100%)",
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
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-slate-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              6 Members
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Board of Governors
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              The Lutheran School Management Board, the governing body whose
              strategic leadership and commitment have kept LHS on a path of
              excellence for over 70 years.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        {/* About the LSMB */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-slate-500 mb-3">
            About the LSMB
          </span>
          <h2
            className="text-2xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Lutheran School Management Board
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-4">
            The Lutheran School Management Board (LSMB) is the governing body of
            Lutheran High School, Obot Idim. Appointed by the Lutheran Church of
            Nigeria, the board provides institutional leadership, strategic
            oversight, and accountability, ensuring the school remains true to
            its Christian educational mission while meeting the highest national
            and international academic standards.
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            The LSMB's strong commitment and active support is listed among the
            core reasons why LHS stands apart from peer institutions. Their
            stewardship has helped navigate the school through decades of change
            while preserving the values that made it great.
          </p>
        </div>

        {/* Responsibilities */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            Mandate
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Board Responsibilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {responsibilities.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h4
                      className="font-bold text-indigo-900 text-sm mb-1"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {title}
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Board members */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            Members
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Current Board Members
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {board.map(({ name, role, description }) => (
              <div
                key={name}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <Initials name={name} />
                <h4
                  className="font-bold text-indigo-900 text-sm mt-4 mb-0.5"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {name}
                </h4>
                <span className="text-indigo-500 text-xs font-semibold mb-3">
                  {role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="p-8 lg:p-10">
            <div
              className="text-5xl text-violet-500/30 leading-none mb-4 select-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              "
            </div>
            <blockquote
              className="text-xl text-white font-medium leading-relaxed mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Strong commitment and support of members of the Board of Governors
              is among the core pillars that makes LHS the ultimate choice.
            </blockquote>
            <p className="text-indigo-400 text-sm">
              LHS Why We Are the Ultimate
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/management-staff"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Management Staff
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
