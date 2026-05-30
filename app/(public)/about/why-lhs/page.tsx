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

const reasons = [
  {
    number: "01",
    title: "Full Boarding Facilities",
    icon: "🏠",
    category: "Campus Life",
    desc: "The Luthisco Republic offers structured, comfortable, and safe boarding for students from all over Akwa Ibom and beyond. Dormitories are maintained to high standards with regular inspections, and boarding students benefit from organised study prep, supervised meals, and a community that builds independence.",
  },
  {
    number: "02",
    title: "Highly Qualified & Experienced Staff",
    icon: "🎓",
    category: "Teaching",
    desc: "LHS teachers are not just qualified, they are experienced educators committed to the school's mission. With a culture of continuous professional development and on-campus residency for key staff, LHS ensures that every student has access to genuinely excellent teaching every day.",
  },
  {
    number: "03",
    title: "Optimum Class Size & Ideal Staff-Student Ratio",
    icon: "📐",
    category: "Teaching",
    desc: "We keep class sizes deliberately manageable, ensuring every student receives meaningful attention from their teacher. An ideal staff-student ratio means no child is lost in the crowd, struggling students are identified early, gifted students are stretched further.",
  },
  {
    number: "04",
    title: "Attention to Talents Beyond the Classroom",
    icon: "⭐",
    category: "Holistic Development",
    desc: "Academics are central, but they are not the whole story. Through sports, music, drama, debate, agriculture, and the sciences, LHS actively discovers and develops each student's unique gifts. Many of our most distinguished alumni are celebrated not only for their degrees but for the character built here.",
  },
  {
    number: "05",
    title: "National & International Programmes: WASSCE, SAT",
    icon: "🌍",
    category: "Academic Programmes",
    desc: "Beyond the standard Nigerian curriculum, LHS prepares students for the SAT, opening doors to international universities and global scholarships. Our WASSCE results are consistently outstanding, maintaining LHS's reputation as a first-choice destination for academic families.",
  },
  {
    number: "06",
    title: "Personalized Counselling, Leadership & Entrepreneurship Training",
    icon: "💬",
    category: "Holistic Development",
    desc: "Every student at LHS has access to pastoral guidance and career counselling. Our leadership development programme identifies and nurtures potential leaders, and our entrepreneurship training equips students to create value, not just seek employment.",
  },
  {
    number: "07",
    title: "Audio-Visual Teaching & e-Learning Facilities",
    icon: "🖥️",
    category: "Technology",
    desc: "Classrooms at LHS are equipped with audio-visual aids that make complex topics accessible and engaging. Our e-learning infrastructure connects students to digital resources that extend learning beyond school hours.",
  },
  {
    number: "08",
    title: "Expansive & Well Laid-Out School Premises",
    icon: "🌿",
    category: "Campus Life",
    desc: "The Luthisco Republic is spacious and thoughtfully designed, with playing fields, well-maintained lawns, a school auditorium, science blocks, ICT buildings, hostels, and chapel all within a single, self-contained campus.",
  },
  {
    number: "09",
    title: "Extensive ICT & Science Programmes",
    icon: "🔬",
    category: "Academic Programmes",
    desc: "From the fully equipped computer laboratories to the science research centre, LHS offers an environment where students engage deeply with technology and scientific inquiry. The exclusive ICT vocational programme takes digital skills to the next level.",
  },
  {
    number: "10",
    title: "Serene & Nature-Friendly Educational Environment",
    icon: "🌳",
    category: "Campus Life",
    desc: "Obot Idim is a community of natural beauty, and the LHS campus reflects that. The school's serene setting reduces stress, improves focus, and gives students a learning environment that is both productive and peaceful.",
  },
  {
    number: "11",
    title: "Discipline & Core Value Training Philosophy",
    icon: "⚖️",
    category: "Character Formation",
    desc: "The discipline at LHS is not punitive, it is formative. Our code of conduct, structured daily routine, and Christian ethos work together to shape students of integrity, resilience, and self-discipline who carry those qualities into adulthood.",
  },
  {
    number: "12",
    title: "Security Consciousness",
    icon: "🛡️",
    category: "Campus Life",
    desc: "The safety of every student is paramount. LHS maintains strict entry/exit protocols, compound supervision, and night inspections. Parents can trust that their children are in a secure, well-monitored environment.",
  },
  {
    number: "13",
    title: "On-Campus Residency of Staff",
    icon: "🏡",
    category: "Teaching",
    desc: "Key staff members live on campus, meaning there is always a responsible adult available, issues are addressed immediately, and the school community functions with continuity and care beyond classroom hours.",
  },
  {
    number: "14",
    title: "High Academic & Moral Standards",
    icon: "🏅",
    category: "Character Formation",
    desc: "LHS's track record speaks for itself: best WASC result in West Africa (1974), consistent top results, and 5,000+ alumni in senior roles globally. But we are equally proud that those alumni are known not only for their excellence but for their character.",
  },
  {
    number: "15",
    title: "Strong Board of Governors Commitment",
    icon: "🤝",
    category: "Governance",
    desc: "The Lutheran School Management Board's active engagement provides strategic direction, ensures accountability, and advocates for LHS at the highest levels, giving the school the institutional backing that sustains excellence over generations.",
  },
  {
    number: "16",
    title: "Well Equipped Science & Computer Laboratories",
    icon: "⚗️",
    category: "Academic Programmes",
    desc: "Both junior and senior school laboratories are fully equipped for practical work in Biology, Chemistry, Physics, and Computer Science. Students learn by doing, not just by reading.",
  },
  {
    number: "17",
    title: "Well Equipped & Standard Library",
    icon: "📚",
    category: "Academic Programmes",
    desc: "The LHS library houses an extensive collection of academic texts, reference materials, journals, and digital resources curated for secondary school learning. It is a space that rewards intellectual curiosity.",
  },
  {
    number: "18",
    title: "Overall Passion for Excellence",
    icon: "🔥",
    category: "Culture",
    desc: "This is the summary of everything. From the headmaster's office to the youngest student in JSS1, LHS operates with a contagious culture of striving, for better results, better character, better community. That passion has not dimmed in over 70 years.",
  },
];

const categories = [...new Set(reasons.map((r) => r.category))];

const catColors: Record<string, string> = {
  "Campus Life": "bg-teal-100 text-teal-700 border-teal-200",
  Teaching: "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Holistic Development": "bg-violet-100 text-violet-700 border-violet-200",
  "Academic Programmes": "bg-blue-100 text-blue-700 border-blue-200",
  Technology: "bg-sky-100 text-sky-700 border-sky-200",
  "Character Formation": "bg-rose-100 text-rose-700 border-rose-200",
  Governance: "bg-slate-100 text-slate-700 border-slate-200",
  Culture: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function WhyLHSPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #78350f 0%, #92400e 40%, #1e1b4b 100%)",
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
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-300/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-300 mb-3">
              18 Reasons
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              We Are the Ultimate!
            </h1>
            <p className="text-amber-100 text-lg leading-relaxed">
              Eighteen distinct reasons why Lutheran High School, Obot Idim
              stands apart from every peer institution, in Akwa Ibom, in
              Nigeria, and in West Africa.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-5xl">
        {/* Category filter display */}
        <div className="mb-10">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${catColors[cat]}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Reasons grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {reasons.map(({ number, title, icon, category, desc }) => (
            <div
              key={number}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-400 font-bold text-xs">
                        {number}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${catColors[category]}`}
                      >
                        {category}
                      </span>
                    </div>
                    <h3
                      className="font-bold text-indigo-950 text-sm leading-snug"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {title}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats callout */}
        <div
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="p-8 lg:p-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-5">
              The Numbers
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { val: "1950", label: "Year Founded" },
                { val: "75+", label: "Years of Excellence" },
                { val: "5,000+", label: "Alumni Worldwide" },
                { val: "100%", label: "WAEC Pass Rate" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div
                    className="text-3xl font-bold text-amber-400 mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {val}
                  </div>
                  <div className="text-indigo-300 text-xs uppercase tracking-wider">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-linear-to-r from-amber-500 to-amber-400 rounded-3xl p-8 text-center text-indigo-950 mb-8">
          <h3
            className="font-bold text-2xl mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Ready to Join the Luthisco Republic?
          </h3>
          <p className="text-amber-900 text-sm mb-5">
            Admissions for the 2026/2027 academic session are currently open.
          </p>
          <Link
            href="/admission"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-indigo-950 text-amber-400 font-bold text-sm hover:scale-105 transition-transform shadow-md"
          >
            Start Application →
          </Link>
        </div>

        <BackLink />
      </div>
    </main>
  );
}
