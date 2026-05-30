import Link from "next/link";
import Image from "next/image";

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
  const cleaned = name.replace(
    /^(Rev|Mr|Mrs|Dr|Deac|Pst|HRM|Prof|Engr)\.\s*/i,
    "",
  );
  const parts = cleaned.split(" ");
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-indigo-700 to-violet-700 flex items-center justify-center text-white text-2xl font-bold">
      {initials}
    </div>
  );
}

const staff = [
  {
    name: "Rev. Nsisong Ekpeowo",
    role: "Principal",
    dept: "Executive",
    bio: "Rev. Ekpeowo is an educational leader committed to academic excellence, discipline, character development and the overall growth of Lutheran High School community.",
    image: "/images/principal.jpeg",
  },
  {
    name: "Mr Samuel John",
    role: "Vice Principal, Administration",
    dept: "Administration",
    bio: "Mr John oversees the day-to-day administrative operations of Lutheran High School, ensuring smooth coordination across all departments, facilities, and student services.",
    image: "/images/vp_administration.jpg",
  },
  {
    name: "Ms. Iyakino Akpabio",
    role: "Vice Principal, Academics",
    dept: "Academics",
    bio: "Ms. Akpabio champions the academic vision of LHS, overseeing curriculum delivery, teacher development, examination preparation, and the school's exceptional results record.",
    image: "/images/vp_academics.jpeg",
  },
  {
    name: "Pst. Sifon Iwok",
    role: "Compound Master",
    dept: "Student Affairs",
    bio: "Pst. Iwok is responsible for the physical upkeep and security of the school compound, maintaining the orderly and safe environment that defines life in the Luthisco Republic.",
    image: "/images/compound_master.jpeg",
  },
  {
    name: "Mrs Hannah Ekpeyong",
    role: "Boarding Mistress",
    dept: "Boarding",
    bio: "Mrs. Ekpeyong manages all aspects of the boarding house for female students especially. She oversees food, welfare, discipline, health, and the nurturing residential experience LHS is known for.",
    image: null,
  },
];

const deptColors: Record<string, string> = {
  Executive: "bg-purple-100 text-purple-700 border-purple-200",
  Administration: "bg-blue-100 text-blue-700 border-blue-200",
  Academics: "bg-violet-100 text-violet-700 border-violet-200",
  "Student Affairs": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Boarding: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function ManagementStaffPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #312e81 0%, #1e1b4b 55%, #4c1d95 100%)",
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
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              4 Officers
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Management Staff
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              The dedicated administrators whose daily leadership shapes the
              Luthisco experience, from academics and administration to boarding
              and campus life.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        {/* Intro */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-indigo-500 mb-3">
            Our Team
          </span>
          <h2
            className="text-2xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Team Behind Every Excellent Day
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Highly qualified and experienced staff is one of the 18 core reasons
            LHS stands above peer institutions. The management team works in
            concert to ensure every student's experience at LHS is safe,
            structured, nurturing, and ultimately transformative.
          </p>
        </div>

        {/* Staff profiles */}
        <div className="space-y-6 mb-14">
          {staff.map(({ name, role, dept, bio, image }) => (
            <div
              key={name}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="p-6 lg:p-8 flex flex-col sm:flex-row gap-6">
                {/* Photo / avatar */}
                <div className="shrink-0 flex flex-col items-center sm:items-start">
                  {image ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-100">
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <Initials name={name} />
                  )}
                  <span
                    className={`mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${deptColors[dept]}`}
                  >
                    {dept}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3
                    className="font-bold text-indigo-950 text-xl mb-0.5"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {name}
                  </h3>
                  <p className="text-indigo-500 font-semibold text-sm mb-3">
                    {role}
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Values strip */}
        <div
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="p-8 lg:p-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Our Commitment
            </span>
            <h2
              className="text-2xl font-bold text-white mb-6"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              What the Management Team Stands For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "🎓",
                  title: "Academic Rigour",
                  desc: "Ensuring every student is prepared to excel in national and international examinations.",
                },
                {
                  icon: "🛡️",
                  title: "Student Safety",
                  desc: "Maintaining a secure, orderly campus where every student can thrive without fear.",
                },
                {
                  icon: "💡",
                  title: "Staff Excellence",
                  desc: "Ongoing professional development ensures our teachers deliver world-class instruction.",
                },
                {
                  icon: "❤️",
                  title: "Holistic Welfare",
                  desc: "From health to counselling to boarding — we care for the whole student, not just the academic.",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/10 border border-white/10 rounded-2xl p-4 flex items-start gap-3"
                >
                  <span className="text-xl shrink-0">{icon}</span>
                  <div>
                    <div className="font-semibold text-white text-sm mb-1">
                      {title}
                    </div>
                    <div className="text-indigo-300 text-xs leading-relaxed">
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/teaching-learning"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Teaching &amp; Learning
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
