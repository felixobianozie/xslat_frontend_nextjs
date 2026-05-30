"use client";

import Link from "next/link";

const timeline = [
  {
    year: "1930",
    title: "The Separation",
    text: "On December 10, 1930, the congregation of sixteen villages in Ibesikpo, Nung Udoe, Nung Ukana, Ikot Essien, Ikot Ekwere, Ikot Iko, Ikot Akpan Abia, Ikot Oduot, Ikot Oku Ubo, Ikot Obio Offong, Mbikpong Ikot Edim, Ebere Otu, Afaha Ibesikpo, Afaha Ikot Osom, Mbierebe Obio, Ito Oko and Ikot Okubo, all in Ibesikpo Asutan L.G.A of Akwa Ibom State, left the Qua Iboe Mission in protest after many years of unsatisfactory relationship. Under the leadership of Chief Nyong Etim Udo, the people formed what became known as Ibesikpo United Church.",
  },
  {
    year: "1932",
    title: "A New Affiliation Sought",
    text: 'Two years later, the Ibesikpo United Church, which later became the Evangelical Lutheran Church, sent Rev. Dr. Jonathan Udo Ekong to the United States of America to source for a mission to affiliate with. There he saw an article by Prof. Martin S. Sommer titled: "AFRICA, WE OUGHT TO BE THERE." This was the divine connection the church had prayed for.',
  },
  {
    year: "1934-35",
    title: "The Missionaries Arrive",
    text: "In 1934, the decision to visit and establish a Church in Ibesikpo was taken. Rev. Henry Nau, Pastor Immanuel Alberht and Pastor Otto A. Boecler arrived in Nigeria on January 5, 1935. A month later the three missionaries arrived Nung Udoe, received by Chief Nyong Etim Udo, Effiong Akpan Ukpong, Frank Mazza Udo, N. E. Eton, Akpa Eso, Asuquo Udo Ekong, and Andrew Udo Akpan.",
  },
  {
    year: "1936",
    title: "Lutheran Church of Nigeria Founded",
    text: "Rev. Henry Nau officially established what is known today as the Lutheran Church of Nigeria (formerly Evangelical Lutheran Mission) in April 1936. The missionaries brought not just the gospel but also teaching and administrative credentials, working tirelessly to plant schools and hospitals across the country, including Boeder Memorial School, Lutheran Teachers Training College (Ibakachi), Immanuel Hospital (Eket), and Lutheran High Schools.",
  },
  {
    year: "1949",
    title: "Government Approval",
    text: 'The Evangelical Lutheran Church considered "Christian education of children very important," guided by the philosophy that "The Soul of Education is the Education of the Soul." After Rev. Henry Nau presented the church\'s intent to the Ministry of Education in Enugu, approval was granted on December 27, 1949 to establish Lutheran High School, Obot Idim. An entrance examination was immediately conducted; about 500 candidates sat, and 28 were successful.',
  },
  {
    year: "1950",
    title: "The School Opens",
    text: 'The 28 pioneer students and a seasoned staff began what Ofonime Inyang described as "a well-rounded qualitative and result-oriented secondary education" at the premises of Boechler Memorial Primary School on January 28, 1950. Rev. J. P. Kretzmann led the opening devotion from Deuteronomy 6:6-9, words that set the spiritual foundation the school still stands on today.',
  },
  {
    year: "1952",
    title: "First Female Student",
    text: "Miss Dorah Effiong Udo became the first female student admitted to LHS, a milestone that signalled the school's evolution into a co-educational institution of national significance.",
  },
  {
    year: "1955-61",
    title: "Rapid Growth",
    text: "Between 1955 and 1961 enrolment witnessed a meteoric rise. By 1961, about nineteen teachers were attending to 348 students, a development which necessitated the eventual move from Boecler Memorial School to the present site, the Great Luthisco Republic.",
  },
  {
    year: "1957",
    title: "First Indigenous Principal",
    text: 'Mr. A. A. Obot became the first African and indigenous person to head the institution, a dynamic, forward-looking disciplinarian ably supported by staff including Mr. E. A. Ubom, Mr. E. B. Attah, Mr. P. Dharmapalam, Mr. S. M. Udofia and others. His creed: "I like to encourage our present and future students to study very hard for both themselves and for this nation."',
  },
  {
    year: "1963",
    title: "Chapel & Stadium",
    text: "The LHS Chapel was built and the LHS stadium constructed, cementing the school's commitment to both spiritual formation and athletic excellence.",
  },
  {
    year: "1974",
    title: "Best WASC Result in West Africa",
    text: "Under the headship of Mr. E. A. Ubom, LHS achieved the best result in the West African School Certificate (WASC) examination in the entire West African sub-region, the first secondary school in the country privileged to conduct its WASC examinations without external supervision.",
  },
  {
    year: "1976-79",
    title: "Name Change & Restoration",
    text: "The school's name was temporarily changed to Secondary School, Obot Idim. It reverted to its beloved name, Lutheran High School, in 1979.",
  },
  {
    year: "2000s+",
    title: "Modern Era",
    text: "Agile and adaptive, LHS introduced SAT preparation, an ICT vocational programme, and e-learning facilities. Modern science laboratories, a well-equipped library, and a standard healthcare centre have been added. The school continues to punch far above its weight, producing global leaders across every field of human endeavour.",
  },
];

const notables = [
  {
    name: "Air Marshall Nsikak Eduok",
    note: "Former Chief of Air Staff & first product to become a Federal Minister",
  },
  {
    name: "Justice Edet R. Nkop",
    note: "First product to become Chief Judge of Akwa Ibom State",
  },
  {
    name: "Justice Effiong D. U. Idiong",
    note: "Former Chief Judge of Akwa Ibom State",
  },
  { name: "Prof. Nse Ekpo", note: "First nuclear physicist in Nigeria" },
  {
    name: "Lady Eme Ufot Ekaette",
    note: "First female to lead a national professional association; first female federal Senator",
  },
  {
    name: "Navy Capt. Edet Akpan Archibong",
    note: "First product to become a Military Governor",
  },
  {
    name: "Ambassador Etim J. Okpoyo",
    note: "First product to become AKS Deputy Governor",
  },
  { name: "DIG Archibong Nkanga", note: "Retired Police Chief" },
  {
    name: "Iniobong S. Jimmy",
    note: "Former General Manager, British Airways",
  },
  {
    name: "Dr. Ime Joseph Udo",
    note: "First medical doctor produced by LHS; physician of reputable standing",
  },
  {
    name: "Engr. Martin Essien",
    note: "Petroleum Training Institute, Effurun",
  },
  {
    name: "Rev. Dr. Uduakabasi B. Udofia",
    note: "Medical doctor and international evangelist",
  },
  {
    name: "(...)",
    note: "Many other notable personalities yet to be tracked and documented by our archives department",
  },
];

const facts = [
  { year: "1936", fact: "Lutheran Church founded in Nigeria" },
  {
    year: "1949",
    fact: "Lutheran Mission received approval to establish schools",
  },
  { year: "1950", fact: "LHS founded; 28 students (all males) admitted" },
  { year: "1950", fact: "Rev. J. L. Konz became the pioneer principal" },
  { year: "1952", fact: "Miss Dorah Effiong Udo, first female student" },
  { year: "1954", fact: "Eyo Udo Ekong, first General Prefect of LHS" },
  { year: "1955", fact: "First batch of students passed out" },
  { year: "1957", fact: "Mr. A. A. Obot, first black / indigenous principal" },
  { year: "1959", fact: "Chemistry/Physics lab and school library built" },
  { year: "1961", fact: "Lizzy Hall (female hostel) built" },
  { year: "1963", fact: "LHS Chapel built; LHS stadium constructed" },
  { year: "1974", fact: "LHS made the best WASC result in the country" },
  {
    year: "1976",
    fact: "Name temporarily changed to Secondary School, Obot Idim",
  },
  { year: "1979", fact: "Name reverted to Lutheran High School" },
];

const principals = [
  "Rev. John Louis Konz",
  "Mr. A. A. Obot",
  "Mr. I. J. Ikpe",
  "Mr. B. I. Ekaluo",
  "Mr. E. A. Ubom",
  "Mr. S.E. Etim (Akpan Annang)",
  "Mr. N. J. Utuk",
  "Mr. Godwin Ekong",
  "Mr. O. Mkpong",
  "Mr. E. U. U. Umanah",
  "Mr. Mkpenie",
  "Rev. Offiong U. Idiong",
  "Mr. Ime D. Isine",
  "Mr. Ndarake U. Mbon",
  "Mr. Umondia D. Umondia",
  "Mr. Edem E. Etuk",
  "(...)",
  "Mrs Akon Ekong",
  "Mr. Ifiok Umana JP",
  "Mr. Owoidoho John",
  "Rev. Nsisong Ekpeowo",
];

const houses = [
  {
    name: "Luther House",
    colour: "Red",
    colorClass: "bg-red-500",
    lightClass: "bg-red-100 border-red-200 text-red-800",
    note: "Named after Martin Luther, founder of the Lutheran Church Worldwide.",
  },
  {
    name: "Nau House",
    colour: "Green",
    colorClass: "bg-emerald-500",
    lightClass: "bg-emerald-100 border-emerald-200 text-emerald-800",
    note: "Named after Rev. Henry Nau, the first Resident Missionary who brought Lutheran Church to Nigeria.",
  },
  {
    name: "Konz House",
    colour: "Blue",
    colorClass: "bg-blue-500",
    lightClass: "bg-blue-100 border-blue-200 text-blue-800",
    note: "Named after Rev. John Louis Konz, who accompanied Rev. Nau to Nigeria and became the first principal.",
  },
  {
    name: "Ekong House",
    colour: "Yellow",
    colorClass: "bg-amber-400",
    lightClass: "bg-amber-100 border-amber-200 text-amber-800",
    note: "Named after Rev. Jonathan Udo Ekong, founder of the Lutheran Church of Nigeria.",
  },
];

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
      {children}
    </span>
  );
}

export default function OurHistoryPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #78350f 100%)",
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
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <SectionLabel>Est. 1950</SectionLabel>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Our History
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              From a congregation's act of faith in 1930 to one of Nigeria's
              most celebrated secondary schools, the full story of Lutheran High
              School, Obot Idim.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-5xl">
        {/* How it all started */}
        <div className="mb-16">
          <SectionLabel>How It All Started</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            A Faith That Built a School
          </h2>
          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-8 mb-8">
            <div
              className="text-5xl text-amber-300 leading-none mb-2 select-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              "
            </div>
            <p className="text-slate-700 text-base leading-relaxed italic mb-2">
              And these words, which I commend thee this day, shall be in thine
              heart... thou shall write them upon the post of thy house, and on
              thy gates.
            </p>
            <p className="text-amber-700 text-sm font-semibold">
              Deuteronomy 6:6-9 (KJV), read at the first opening devotion,
              January 28, 1950
            </p>
          </div>
          <p className="text-slate-600 leading-relaxed text-base">
            These words of the Lord, ministered on the first day of opening,
            created great impact not only on the lives of the students and
            members of staff, but on the institution itself. No wonder Lutheran
            High School, Obot Idim has made so much impact globally in all
            fields of human endeavour. It is very true that Lutheran High
            School, Obot Idim was established on Christian foundation. The
            result of her achievement is enviable; positive impact made is
            enormous, and her contribution to academic excellence and manpower
            development globally is unparalleled.
          </p>
        </div>

        {/* Full Timeline */}
        <div className="mb-16">
          <SectionLabel>Chronicles</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Full Story
          </h2>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-linear-to-b from-amber-400 via-indigo-300 to-violet-300" />
            <div className="space-y-8">
              {timeline.map(({ year, title, text }, i) => (
                <div key={year + i} className="flex gap-6 relative">
                  <div className="shrink-0 z-10">
                    <div className="w-10 h-10 rounded-full bg-indigo-800 border-2 border-amber-400 flex items-center justify-center">
                      <span className="text-amber-400 text-[9px] font-bold leading-none text-center">
                        {year.replace("-", "-")}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 flex-1 hover:border-indigo-200 hover:shadow-sm transition-all">
                    <h3
                      className="font-bold text-indigo-900 text-base mb-2"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Academic records callout */}
        <div className="mb-16">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
            }}
          >
            <div className="p-8 lg:p-10">
              <SectionLabel>Academic Records</SectionLabel>
              <h2
                className="text-2xl font-bold text-white mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                A Grade A School
              </h2>
              <p className="text-indigo-200 text-sm leading-relaxed mb-4">
                The academic records of LHS have always been impressive right
                from her inception. INSPECTORS OF EDUCATION in the then Eastern
                Region once made the following observation:
              </p>
              <blockquote className="border-l-4 border-amber-400 pl-5 text-indigo-100 text-base italic leading-relaxed mb-4">
                "Lutheran High School, Obot Idim is one of the best schools in
                the country going by her academic standard: LHS has produced the
                best of minds in the academia. Her academic record has been very
                high, impressive, highly commendable judging from the number of
                admissions granted to students in higher institutions within and
                outside the country."
              </blockquote>
              <p className="text-indigo-400 text-xs">
                School Records, Ministry of Education, Enugu, 1961
              </p>
            </div>
          </div>
        </div>

        {/* Dormitory Life */}
        <div className="mb-16">
          <SectionLabel>Campus Life</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-5"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Luthisco Republic
          </h2>
          <p className="text-slate-600 leading-relaxed text-base mb-5">
            Lutheran High School was predominantly a boarding school until the
            early 1970s when day-studentship was introduced. Life in the
            dormitory was so exciting and unique that no serious-minded student
            would ever have wanted to miss it, with friendly boarding
            experiences, decent meals, good discipline, high moral training, and
            rich interactions among students.
          </p>
          <p className="text-slate-600 leading-relaxed text-base mb-6">
            Boarders were, and still are, regarded as first-class citizens in
            the "Luthisco Republic." Male students are housed in four hostels,{" "}
            <strong>Nau, Luther, Ekong and Konz</strong>, while female students
            are accommodated in what was historically called{" "}
            <strong>Lizzy Hall</strong>. Nau and Luther are popularly known as{" "}
            <em>Old Colony</em>, while Ekong and Konz constitute the{" "}
            <em>New Colony</em>.
          </p>

          {/* House Colours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {houses.map(({ name, colour, colorClass, lightClass, note }) => (
              <div
                key={name}
                className={`border rounded-2xl p-5 ${lightClass}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full ${colorClass} shrink-0`}
                  />
                  <h4 className="font-bold text-sm">{name}</h4>
                  <span className="ml-auto text-xs font-semibold uppercase tracking-wider opacity-70">
                    {colour}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-80">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Areas of significant performance */}
        <div className="mb-16">
          <SectionLabel>Notable Achievements</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Areas of Significant Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: "🏅",
                title: "Best WASC in West Africa",
                desc: "In 1974, under Principal E. A. Ubom, LHS achieved the best WASC result in the entire West African sub-region, the first school to conduct its exams without external supervision.",
              },
              {
                icon: "🌍",
                title: "UNESCO Recognition",
                desc: "UNESCO approved the establishment of a UNESCO Club at LHS, one of only three schools chosen and sponsored by UNESCO in the then Eastern States of Nigeria.",
              },
              {
                icon: "⚽",
                title: "Co-curricular Excellence",
                desc: "LHS was never left out of any important competitive event in sports, debates, or drama. Weekly variety shows, football, debate, cultural nights, built student confidence and morale.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h4
                  className="font-bold text-indigo-900 text-sm mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {title}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notable Alumni */}
        <div className="mb-16">
          <SectionLabel>Our Alumni</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Notable Old Students
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notables.map(({ name, note }) => (
              <div
                key={name}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-amber-300 hover:bg-amber-50 transition-all"
              >
                <span className="text-amber-400 text-lg shrink-0">★</span>
                <div>
                  <div className="font-semibold text-indigo-900 text-sm">
                    {name}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-snug">
                    {note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Facts File */}
        <div className="mb-16">
          <SectionLabel>Facts File</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Key Dates at a Glance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {facts.map(({ year, fact }, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3"
              >
                <span className="text-indigo-700 font-bold text-sm w-10 shrink-0">
                  {year}
                </span>
                <span className="w-px h-5 bg-slate-200 shrink-0" />
                <span className="text-slate-600 text-sm">{fact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Principals */}
        <div className="mb-16">
          <SectionLabel>Leadership</SectionLabel>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Chronicles of Principals
          </h2>
          <div className="flex flex-wrap gap-2">
            {principals.map((p, i) => (
              <div
                key={p}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-slate-700 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trends */}
        <div className="rounded-3xl bg-linear-to-br from-indigo-950 via-indigo-900 to-violet-950 p-8 lg:p-10 text-white mb-8">
          <SectionLabel>Today</SectionLabel>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Trends Assessment
          </h2>
          <p className="text-indigo-200 leading-relaxed text-base">
            It has been a long walk from 1950 till date. Trends have changed.
            Modern academic requirements came with new-generation pressures, but
            we have been agile and adaptive, vigorously keeping up with the
            ever-changing trends of modern school management while preserving
            academic excellence. Overall, there is progress against all odds.
          </p>
          <p className="text-indigo-400 text-xs mt-4 italic">
            Culled from "LUTHERAN HIGH SCHOOL OBOT IDIM: HOW IT ALL BEGAN" by
            Pastor Mike Effiok-Abasi, in{" "}
            <em>
              Essays in Celebration of 60 Years of Excellence in Academic
              Development and Leadership
            </em>{" "}
            (2010), with extra inputs by current School Management.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/anthem"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: School Anthem
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
