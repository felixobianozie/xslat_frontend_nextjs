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

const rules = [
  {
    title: "Opening and Closing",
    icon: "🚪",
    points: [
      "All boarders must report back to the boarding house a day before the official reopening date, between 12:00pm and 5:00pm.",
      "All boarders must surrender their luggage for checking by the House Master/Mistress or an accredited representative before being cleared to move into the dormitories.",
      "No boarder will be checked into the dormitories without evidence of fee payment - the teller.",
      "Day students must report on the official reopening date with evidence of fee payment and in their correct school uniform before being allowed entry into the school compound.",
    ],
    penalty: null,
  },
  {
    title: "Movements",
    icon: "🚶",
    points: [
      "No student should leave the school compound without express permission from the Principal, Vice Principal, or Boarding Master/Mistress.",
      "All exit/entry into the school compound must be through the main/authorized entrance - The Gate.",
      "Students should walk on the walk paths and not across the lawns or field(s) in the school compound.",
      'No student should be found outside their dormitories after evening meal except in their preparatory classroom. On no account should any student be found outside the hostel after "lights out".',
      "Absence during preparatory class and night inspection is an offence.",
    ],
    penalty:
      "Suspension from classes / manual labour / expulsion. Gate violation: two days manual labour. Lawn violation: grass cutting or planting of grass. Lights-out violation: one week suspension.",
  },
  {
    title: "School Bell",
    icon: "🔔",
    points: [
      "All students must obey the school bell promptly.",
      "The wake-up bell is rung at 5:30am. All students are expected to wake up, attend morning prayers, and take part in morning duties immediately after morning prayers.",
      "Morning Assemblies, Sunday Worship, and Solemn Assemblies are compulsory to all students.",
    ],
    penalty: "Manual labour for one day.",
  },
  {
    title: "Anti-Social Behaviour",
    icon: "🚫",
    points: [
      "Anti-social behaviours include: stealing, insult, assault, fighting, smoking, alcoholism, use of canes, writing on walls/floors/desks, unauthorized plucking of fruits, drug abuse, use of non-essential materials, pornographic content, use of harmful/dangerous weapons (axe, rifle, penknife), bullying, extortion, illegal relationships, illegal meetings or unlawful assembly, and dual habitation.",
    ],
    penalty:
      "Suspension / expulsion / forceful withdrawal from the school and any other punishment deemed fit by the Disciplinary Committee.",
  },
  {
    title: "School Clubs",
    icon: "🎭",
    points: [
      "Available clubs: Jets/Science Club, Young Farmer's Club, Literary/Debating Club, Press Club, Choral/Cultural Club, Mathematics Club, and Bible Readers Club.",
      "All students are to compulsorily participate in Club meetings, Games and Sports, as well as compound work.",
      "Each student is expected to join one - but not more than two - clubs.",
      "Time is provided in the General School Time Table to enable students attend their club meetings.",
    ],
    penalty:
      "Culprit will be deprived of their break time for manual labour for one week.",
  },
  {
    title: "Feeding Habits",
    icon: "🍽️",
    points: [
      "No cooked food item should be eaten in the dormitory - only in the Refectory.",
      "Any food item taken into the hostel(s) shall be confiscated and destroyed.",
      "Taking of double ration is highly prohibited. Any student caught will be subjected to unassisted manual labour for one day.",
      "All purchases from the Truck-shop, Canteen, or any part of the compound should be during Break Time (11:30am to 12:00noon).",
      "No student is allowed to cook in the hostel. Any student found with a cooking utensil will face suspension and the item will be seized.",
      "All students are expected to use their cutleries when eating in the dining room.",
    ],
    penalty:
      "Food items: confiscation and destruction. Double ration: manual labour. Cooking in hostel: suspension.",
  },
  {
    title: "Sanitation",
    icon: "🧹",
    points: [
      "The cleanliness of the school, dormitories, classrooms, and surrounding areas is the concern of every student.",
      "Careless dropping of pieces of paper, food wrappings, and writing on walls, floors, windows, and desks is an offence.",
      "All boarders must be present for the general cleaning and inspection on Saturdays.",
    ],
    penalty:
      "Writing on surfaces: a surcharge of 20 litres of paint as recommended by school authority. Absent from Saturday cleaning: manual work for one day / washing of gutter or toilet(s).",
  },
  {
    title: "Uniform",
    icon: "👔",
    points: [
      "Specified school uniform for each occasion as recommended by the school authority must be worn by all students.",
      "Improper dressing will not be tolerated even during games.",
      "No coloured material other than those prescribed by the school authority should be brought into the school compound.",
    ],
    penalty:
      "Non-prescribed materials will be seized and not returned to the owner until their final year in school.",
  },
  {
    title: "Siesta",
    icon: "😴",
    points: [
      "All boarders must observe siesta at the stipulated hour on the timetable.",
    ],
    penalty:
      "Any student found outside during siesta will be subjected to manual labour.",
  },
  {
    title: "Noise",
    icon: "🔇",
    points: [
      "There should be no disturbances on the school compound at any time.",
      "Noise-making and loitering during prep, classes, and other official assemblies are not allowed.",
      "No musical instrument(s) should be brought to the school compound by any student.",
    ],
    penalty:
      "Musical instruments will be confiscated and only returned at the end of the student's final year in school.",
  },
  {
    title: "Visiting Day",
    icon: "👨‍👩‍👧",
    points: [
      "The first Saturday of every month has been set aside for parents/guardians to visit their wards between 10:00am and 5:00pm.",
      "Visitors are not to be received in the dormitories but in the auditorium.",
      "Parents/Guardians who wish to see their ward on an emergency outside of Visiting Day should discuss with the House Master/Mistress, Vice Principal, or Principal.",
    ],
    penalty:
      "Student received on a non-visiting day: the student will be sent home with the parent/guardian for one week.",
  },
  {
    title: "Out of Bounds",
    icon: "⛔",
    points: [
      "The kitchen - except to Food Board members and Dining Hall Prefects.",
      "Staff quarters and staff rooms - except on invitation or official errand.",
      "Dormitories, Refectory, Canteen, and Terraces during classes and other school assemblies.",
      "Hall of residence/dormitories are out of bounds to all visitors.",
      "Girls' hostels are out of bounds for boys and vice versa.",
      "The school premises are out of bounds for day students after official school hours, except on invitation.",
    ],
    penalty: null,
  },
  {
    title: "Mobile Phones",
    icon: "📵",
    points: [
      "The use of GSM phones by students is highly prohibited in school.",
      "Parents are advised to counsel their children against bringing any phone to school.",
    ],
    penalty:
      "The student will be dismissed and the phone(s) will not be returned.",
  },
  {
    title: "Academic Work",
    icon: "📝",
    points: [
      "Taking Continuous Assessment tests and internal examinations are compulsory.",
      "Examination malpractices are viewed as stealing.",
      "Alteration of scores during tests/examinations shall be viewed as examination malpractice.",
      "Refusal to take tests and examinations is a very bad attitude towards learning.",
    ],
    penalty:
      "Corporal punishment. Consistent refusal results in dismissal from the school.",
  },
  {
    title: "Official Language",
    icon: "🗣️",
    points: [
      "The official language of the school is English Language.",
      "Any student caught communicating in vernacular will be made to cut grass for two days during school hours.",
    ],
    penalty: "Grass cutting for two school days.",
  },
  {
    title: "Regularity in Attendance",
    icon: "✅",
    points: [
      "Students must attend and be punctual to morning assembly, roll call in classes, preparatory classes, siesta, the dining hall, compound work, and games.",
    ],
    penalty:
      "Warning / grass cutting / corporal punishment / washing of gutter or toilet.",
  },
  {
    title: "Dual Habitation",
    icon: "🏠",
    points: [
      "Dual habitation is highly prohibited. Any student who occupies a private house (BASE) in addition to the dormitory will face ejection from the hostel and/or expulsion on the recommendation of the Disciplinary Committee.",
    ],
    penalty: "Ejection from hostel / expulsion.",
  },
  {
    title: "Routing of Reports",
    icon: "📢",
    points: [
      "All forms of maltreatment should be reported to the Class Teacher, House Master/Mistress, Boarding Master, or the Vice Principals.",
      "Never rush to your parents/guardians first before reporting the case to the school authority.",
    ],
    penalty: "Expulsion.",
  },
];

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #7f1d1d 0%, #991b1b 55%, #450a0a 100%)",
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
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-red-300/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-red-300 mb-3">
              Code of Conduct
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Golden Rules &amp; Regulations
            </h1>
            <p className="text-red-100 text-lg leading-relaxed">
              Lutheran High School upholds a high standard of Christian
              discipline. Every rule here is designed not to restrict, but to
              build character, protect community, and produce graduates of
              excellence.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        {/* Preamble */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-rose-600 mb-3">
            Preamble
          </span>
          <h2
            className="text-2xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            A Christian Institution of Discipline
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-4">
            Lutheran High School, Obot Idim is a co-educational Christian
            institution which seeks to train its students mentally, physically,
            and spiritually. The school therefore strives to live up to the
            highest principles of Christian conduct. It also recognises the
            national need for honest, God-fearing, and righteous citizens who
            would be good leaders to our society tomorrow.
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            In order to achieve this, a high standard of discipline is therefore
            highly necessary, hence the following rules and regulations.
          </p>
        </div>

        {/* Quick navigation chips */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">
            Jump to Section
          </h3>
          <div className="flex flex-wrap gap-2">
            {rules.map(({ title, icon }) => (
              <a
                key={title}
                href={`#${title.toLowerCase().replace(/\s+/g, "-")}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 transition-all"
              >
                <span>{icon}</span>
                {title}
              </a>
            ))}
          </div>
        </div>

        {/* Rules list */}
        <div className="space-y-5 mb-14">
          {rules.map(({ title, icon, points, penalty }) => (
            <div
              key={title}
              id={title.toLowerCase().replace(/\s+/g, "-")}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden scroll-mt-24"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <span className="text-xl">{icon}</span>
                <h3
                  className="font-bold text-indigo-900 text-base"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {title}
                </h3>
              </div>
              <div className="px-6 py-4">
                <ul className="space-y-2 mb-4">
                  {points.map((pt, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
                {penalty && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <span className="text-rose-500 shrink-0 mt-0.5">⚡</span>
                    <div>
                      <span className="text-rose-700 text-xs font-bold uppercase tracking-wider">
                        Penalty:{" "}
                      </span>
                      <span className="text-rose-700 text-xs leading-relaxed">
                        {penalty}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <div
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="p-8 lg:p-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Conclusion
            </span>
            <p className="text-indigo-100 text-base leading-relaxed mb-3">
              Students should show respect to constituted authorities of the
              school. Be reminded that your continued stay in the school is
              dependent on your good behaviour, good conduct, and good attitude
              towards learning.
            </p>
            <p className="text-indigo-300 text-sm leading-relaxed">
              The law is no respecter of persons. Prefects and other students
              are equally bound by these Rules and Regulations.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/board-of-governors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Board of Governors
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
