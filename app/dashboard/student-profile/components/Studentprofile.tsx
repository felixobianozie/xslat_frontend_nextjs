"use client";

// ──────────────────────────────────────────
// Studentprofile.tsx
//
// A student's profile, at /dashboard/student-profile?id=<student id>. It is
// reached from "View Profile" in the Students list.
//
//   - The header card has the photo, the name, the public ID, the status at this
//     school and the current class. The photo is a placeholder (initials and a
//     camera button) until students have a photo to show.
//   - "Edit details" turns Personal details, Contact and Addresses into one form.
//     Save sends only the fields that changed. Cancel, or a successful save, goes
//     back to reading.
//   - School record is read-only: the school, registration number, boarding,
//     status, current class and when the student was added. Those have their own
//     workflows, and the update endpoint would apply a registration number or
//     boarding change to the student's current school, which is not always this
//     one.
//
// Anyone who can open the page sees "Edit details". The backend decides who may
// save: someone without permission gets its message, shown in the form and as a
// toast.
//
// Mobile-first: one column on a phone, two for the section cards from `lg`.
// ──────────────────────────────────────────

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Pencil } from "lucide-react";
import { toast } from "react-toastify";

import { apiErrorText } from "@/lib/Apierrortext";
import { personName } from "@/lib/Personname";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";

import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import {
  DetailRow,
  ProfileSection,
  formatProfileDate,
  joinAddress,
} from "../../components/Profilecard";
import { AddressFields } from "../../components/Profilefields";
import ProfilePhoto from "../../components/Profilephoto";
import StudentStatusPill from "../../students/components/Studentstatuspill";
import {
  MAX_LENGTH,
  StudentLoadError,
  ageOf,
  changesBetween,
  formFrom,
  formatClass,
  formatDob,
  friendlyStudentError,
  genderLabel,
  portfolioAt,
  todayIso,
  validateForm,
  type EditableField,
  type StudentForm,
} from "../studentprofile";
import { ContactFields, PersonalFields } from "./Studentfields";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface StudentResponse {
  message: string;
  data: StudentProfileRecord;
}

// The inputs of an address block, in the order they are shown.
function addressFields(prefix: "r" | "o") {
  return [
    { suffix: "address", label: "Address" },
    { suffix: "city", label: "City" },
    { suffix: "lga", label: "LGA" },
    { suffix: "state", label: "State" },
    { suffix: "country", label: "Country" },
  ].map(({ suffix, label }) => {
    const name = `${prefix}_${suffix}` as EditableField;
    return { name, label, maxLength: MAX_LENGTH[name] };
  });
}
const RESIDENTIAL_FIELDS = addressFields("r");
const ORIGIN_FIELDS = addressFields("o");

interface StudentProfileProps {
  studentId: string;
  // Fetched by the page on the server; null when that fetch failed.
  initialData: StudentProfileRecord | null;
}

export default function StudentProfile({
  studentId,
  initialData,
}: StudentProfileProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const queryClient = useQueryClient();

  // When the page's data was fetched: now, read once. Together with the staleTime
  // below it tells React Query the server data is fresh, so it does not fetch
  // again the moment the page opens.
  const [mountedAt] = useState(() => Date.now());
  // Today, read once: the age and the latest date of birth are worked out from it.
  const [today] = useState(() => new Date());

  const {
    data: student,
    isPending,
    error,
  } = useQuery<StudentProfileRecord, StudentLoadError>({
    queryKey: ["student-profile", SCHOOL_ID, studentId],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<StudentResponse>(
        `student/detail/?id=${encodeURIComponent(studentId)}&school-id=${SCHOOL_ID}`,
      );
      if (error) throw new StudentLoadError(error.message, error.status);
      return data!.data;
    },
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? mountedAt : undefined,
    // The data is treated as fresh for 30 seconds (the app's default is none, which
    // would fetch it again the moment the page opens). Saving refreshes it anyway.
    staleTime: 30 * 1000,
    // A missing or forbidden student will not appear by asking again.
    retry: (failureCount, err) =>
      !(err.status && err.status < 500) && failureCount < 2,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<StudentForm | null>(null);
  const [formError, setFormError] = useState("");

  const { mutate, isPending: isSaving } = useMutation<
    void,
    Error,
    Partial<StudentForm>
  >({
    mutationFn: async (changes) => {
      const { error } = await clientAuthFetch("student/detail/", {
        method: "PUT",
        body: { id: studentId, school_id: SCHOOL_ID, ...changes },
      });
      if (error) throw new Error(friendlyStudentError(apiErrorText(error)));
    },
    onSuccess: () => {
      toast.success("The student's details were updated.");
      queryClient.invalidateQueries({
        queryKey: ["student-profile", SCHOOL_ID, studentId],
      });
      // The Students list shows the same names and classes.
      queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
      setIsEditing(false);
      setFormError("");
    },
    onError: (err) => {
      setFormError(err.message);
      toast.error(err.message);
    },
  });

  const backLink = (
    <Link
      href="/dashboard/students"
      className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
    >
      <ChevronLeft size={14} />
      <span>Back to students</span>
    </Link>
  );

  if (!student) {
    return (
      <div className="pb-10">
        {backLink}
        {isPending ? (
          <div className="animate-pulse">
            <div className="h-56 rounded-2xl bg-slate-100" />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="h-56 rounded-2xl bg-slate-100" />
              <div className="h-56 rounded-2xl bg-slate-100" />
            </div>
          </div>
        ) : (
          <EmptyState
            variant="students"
            title="Could not load this student"
            description={error?.message ?? "Something went wrong."}
          />
        )}
      </div>
    );
  }

  const fullName = personName(student);
  const portfolio = portfolioAt(student, SCHOOL_ID);
  const className = formatClass(student.current_arm);
  const age = ageOf(student.dob, today);
  const changes = form ? changesBetween(student, form) : {};
  const hasChanges = Object.keys(changes).length > 0;

  function startEditing() {
    setForm(formFrom(student!));
    setFormError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFormError("");
  }

  function setField(field: EditableField, value: string) {
    setForm((previous) =>
      previous ? { ...previous, [field]: value } : previous,
    );
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;

    const problem = validateForm(form, today);
    if (problem) {
      setFormError(problem);
      return;
    }
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    setFormError("");
    mutate(changes);
  }

  return (
    <div className="pb-10">
      {backLink}

      <div className="pb-4">
        <h1 className="text-xl font-bold text-slate-800">Student Profile</h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Personal details, contact and school record.
        </p>
      </div>

      {/* Header card: banner, photo and name. The photo overlaps the banner. */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-20 sm:h-24 bg-linear-to-r from-violet-500 to-indigo-500" />
        <div className="px-5 pb-5">
          <div className="-mt-12 sm:-mt-14">
            <ProfilePhoto
              firstName={student.first_name}
              lastName={student.last_name}
            />
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-800 wrap-break-word">
            {fullName}
          </h2>
          <p className="text-xs text-slate-400">
            {[
              student.public_id,
              `Added ${formatProfileDate(student.created_on)}`,
            ]
              .filter(Boolean)
              .join(" \u00b7 ")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {portfolio && <StudentStatusPill status={portfolio.status} />}
            {className ? (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                {className}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                Not in a class
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Editable: personal details, contact and addresses share one form. */}
      <form
        onSubmit={handleSave}
        className="mt-4 grid gap-4 lg:grid-cols-2"
        noValidate
      >
        <ProfileSection
          title="Personal details"
          action={
            !isEditing && (
              <button
                type="button"
                onClick={startEditing}
                className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700"
              >
                <Pencil size={12} />
                <span>Edit details</span>
              </button>
            )
          }
        >
          {isEditing && form ? (
            <PersonalFields
              form={form}
              onChange={setField}
              maxDob={todayIso(today)}
            />
          ) : (
            <dl className="divide-y divide-slate-50">
              <DetailRow label="First name">{student.first_name}</DetailRow>
              <DetailRow label="Middle name">{student.middle_name}</DetailRow>
              <DetailRow label="Last name">{student.last_name}</DetailRow>
              <DetailRow label="Gender">
                {genderLabel(student.gender)}
              </DetailRow>
              <DetailRow label="Date of birth">
                {[formatDob(student.dob), age !== null && `${age} years old`]
                  .filter(Boolean)
                  .join(" \u00b7 ")}
              </DetailRow>
            </dl>
          )}
        </ProfileSection>

        <ProfileSection title="Contact">
          {isEditing && form ? (
            <ContactFields form={form} onChange={setField} />
          ) : (
            <dl className="divide-y divide-slate-50">
              <DetailRow label="Email">{student.email}</DetailRow>
              <DetailRow label="Phone">{student.phone}</DetailRow>
            </dl>
          )}
        </ProfileSection>

        <div className="lg:col-span-2">
          <ProfileSection title="Addresses">
            {isEditing && form ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <AddressFields
                  title="Residential"
                  fields={RESIDENTIAL_FIELDS}
                  values={form}
                  onChange={setField}
                />
                <AddressFields
                  title="Origin"
                  fields={ORIGIN_FIELDS}
                  values={form}
                  onChange={setField}
                />
              </div>
            ) : (
              <dl className="divide-y divide-slate-50">
                <DetailRow label="Residential">
                  {joinAddress([
                    student.r_address,
                    student.r_city,
                    student.r_lga,
                    student.r_state,
                    student.r_country,
                  ])}
                </DetailRow>
                <DetailRow label="Origin">
                  {joinAddress([
                    student.o_address,
                    student.o_city,
                    student.o_lga,
                    student.o_state,
                    student.o_country,
                  ])}
                </DetailRow>
              </dl>
            )}
          </ProfileSection>
        </div>

        {isEditing && (
          <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p role="alert" className="min-h-4 text-xs text-red-600">
              {formError}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!hasChanges || isSaving}
                className="cursor-pointer relative flex items-center justify-center px-5 py-2 text-xs text-white rounded-xl bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={isSaving ? "invisible" : ""}>
                  Save changes
                </span>
                <span
                  className={`absolute inset-0 flex items-center justify-center ${
                    isSaving ? "" : "invisible"
                  }`}
                >
                  <ButtonLoader />
                </span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Read-only: the student's record at this school. */}
      <div className="mt-4">
        <ProfileSection
          title="School record"
          description="Managed from the Students list."
        >
          <dl className="divide-y divide-slate-50">
            <DetailRow label="School">{portfolio?.school.name}</DetailRow>
            <DetailRow label="Registration number">
              {portfolio?.reg_numb}
            </DetailRow>
            <DetailRow label="Boarding">
              {portfolio ? (portfolio.boarding ? "Boarding" : "Day") : ""}
            </DetailRow>
            <DetailRow label="Status">
              {portfolio && <StudentStatusPill status={portfolio.status} />}
            </DetailRow>
            <DetailRow label="Current class">{className}</DetailRow>
            <DetailRow label="Added to school">
              {formatProfileDate(portfolio?.created_on)}
            </DetailRow>
          </dl>
        </ProfileSection>
      </div>
    </div>
  );
}
