import { serverAuthFetch } from "@/lib/Serverauthfetch";

import EmptyState from "../components/Emptystate";
import StudentProfile from "./components/Studentprofile";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface StudentResponse {
  message: string;
  data: StudentProfileRecord;
}

// Fetched on the server so the page arrives with the student already in it. Null
// when the fetch fails; the client component then fetches again and shows why a
// student could not be loaded.
async function fetchInitialStudent(
  studentId: string,
): Promise<StudentProfileRecord | null> {
  const { data, error } = await serverAuthFetch<StudentResponse>(
    `student/detail/?id=${encodeURIComponent(studentId)}&school-id=${SCHOOL_ID}`,
  );
  if (error || !data) {
    console.error("Failed to fetch the student profile:", error?.message);
    return null;
  }
  return data.data;
}

const MAIN_CLASSES =
  "h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]";

// /dashboard/student-profile?id=<student id>
export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <main className={MAIN_CLASSES}>
        <EmptyState
          variant="students"
          title="No student selected"
          description="Open a profile from the Students list."
        />
      </main>
    );
  }

  const initialStudent = await fetchInitialStudent(id);

  return (
    <main className={MAIN_CLASSES}>
      <StudentProfile studentId={id} initialData={initialStudent} />
    </main>
  );
}
