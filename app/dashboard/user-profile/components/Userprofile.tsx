"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Userprofile.tsx
//
// The signed-in person's own profile.
//
//   Header card        Photo (a placeholder), name, public ID, how they joined.
//   Personal details   Name and gender. Editable.
//   Addresses          Residential and office. Editable.
//   Contact            Email and phone with their verified state. Read-only:
//                      changing them goes through verification, so an
//                      unverified one has a Verify button that opens the same
//                      panel the onboarding card uses.
//   Account            Public ID, how they joined, default user type, sign-up
//                      type, member since, last sign-in. Read-only.
//   My schools         Every school they hold a staff portfolio in, with
//                      status and roles. Only this school's card links to its
//                      staff profile: the app serves one school, so the other
//                      schools are shown for information.
//
// Editing:
//  - "Edit details" turns Personal details and Addresses into one form. Save
//    sends only the fields that changed, with PUT users/detail/, and the
//    backend refuses everything else. First and last name are required.
//  - Cancel, or a successful save, goes back to reading.
//
// Data layer:
//  - GET users/me/, under the key ["user", userId] that the onboarding card and
//    the verify panels already use, so verifying an email or phone refreshes
//    this page too.
//  - initialData is the response the page fetched on the server.
//
// The camera button is a placeholder until photos are built.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { apiErrorText } from "@/lib/Apierrortext";
import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import {
  DetailRow,
  ProfileSection,
  VerifiedBadge,
  formatProfileDate,
  joinAddress,
} from "../../components/Profilecard";
import {
  AddressFields,
  SelectField,
  TextField,
} from "../../components/Profilefields";
import ProfilePhoto from "../../components/Profilephoto";
import VerifyEmailPanel from "../../components/Verifyemailpanel";
import VerifyPhonePanel from "../../components/Verifyphonepanel";
import StaffStatusBadge from "../../staff/components/Staffstatusbadge";
import { EMPLOYMENT_CHOICES } from "../../staff/staffstatus";
import { personName } from "@/lib/Personname";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface UserMeResponse {
  message: string;
  data: UserMe;
}

// ── The editable fields ──────────────────────────────────────────────────────

const EDITABLE_FIELDS = [
  "first_name",
  "middle_name",
  "last_name",
  "gender",
  "r_address",
  "r_city",
  "r_district",
  "r_state",
  "r_country",
  "o_address",
  "o_city",
  "o_district",
  "o_state",
  "o_country",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];
type ProfileForm = Record<EditableField, string>;

// The longest each text field may be, as the backend allows.
const MAX_LENGTH: Record<EditableField, number> = {
  first_name: 150,
  middle_name: 20,
  last_name: 150,
  gender: 4,
  r_address: 30,
  r_city: 30,
  r_district: 30,
  r_state: 30,
  r_country: 30,
  o_address: 30,
  o_city: 30,
  o_district: 30,
  o_state: 30,
  o_country: 30,
};

// The inputs of an address block, in the order they are shown.
function addressFields(prefix: "r" | "o") {
  return [
    { suffix: "address", label: "Address" },
    { suffix: "city", label: "City" },
    { suffix: "district", label: "District" },
    { suffix: "state", label: "State" },
    { suffix: "country", label: "Country" },
  ].map(({ suffix, label }) => {
    const name = `${prefix}_${suffix}` as EditableField;
    return { name, label, maxLength: MAX_LENGTH[name] };
  });
}
const RESIDENTIAL_FIELDS = addressFields("r");
const OFFICE_FIELDS = addressFields("o");

const GENDER_OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: "NOTA", label: "Not specified" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

function genderLabel(value: ProfileGender): string {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? "";
}

function formFrom(user: UserMe): ProfileForm {
  return Object.fromEntries(
    EDITABLE_FIELDS.map((field) => [field, user[field] ?? ""]),
  ) as ProfileForm;
}

// The fields whose trimmed value differs from the saved profile.
function changesBetween(user: UserMe, form: ProfileForm): Partial<ProfileForm> {
  const changes: Partial<ProfileForm> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = field === "gender" ? form[field] : form[field].trim();
    if (value !== (user[field] ?? "")) changes[field] = value;
  }
  return changes;
}

function employmentLabel(value: UserPortfolioSummary["employment"]): string {
  return (
    EMPLOYMENT_CHOICES.find((choice) => choice.value === value)?.label ?? ""
  );
}

// ── Component ────────────────────────────────────────────────────────────────

type OpenPanel = "email" | "phone" | null;

export default function UserProfile({
  initialData,
}: {
  // Fetched by the page on the server; null when that fetch failed.
  initialData: UserMeResponse | null;
}) {
  const { clientAuthFetch } = useClientAuthFetch();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const userId = session?.accessClaims?.user_id ?? initialData?.data.id ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [formError, setFormError] = useState("");
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  // When the page's data was fetched: now, read once. It tells React Query the
  // server data is fresh, so it does not refetch the moment the page opens.
  const [mountedAt] = useState(() => Date.now());

  const { data: envelope, error } = useQuery<UserMeResponse>({
    queryKey: ["user", userId],

    queryFn: async () => {
      const { data, error } =
        await clientAuthFetch<UserMeResponse>("users/me/");
      if (error) throw new Error(error.message);
      return data!;
    },

    enabled: !!userId,
    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? mountedAt : undefined,
  });

  const user = envelope?.data;

  // ── Saving ─────────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation<void, Error, Partial<ProfileForm>>({
    mutationFn: async (changes) => {
      const { error } = await clientAuthFetch("users/detail/", {
        method: "PUT",
        body: { user_id: user!.id, ...changes },
      });
      if (error) throw new Error(apiErrorText(error));
    },
    onSuccess: () => {
      toast.success("Your details were updated.");
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      setIsEditing(false);
      setFormError("");
    },
    onError: (err) => {
      setFormError(err.message);
      toast.error(err.message);
    },
  });

  if (!user) {
    return (
      <div className="py-6">
        {error ? (
          <EmptyState
            title="Could not load your profile"
            description={error.message}
          />
        ) : (
          <div className="animate-pulse">
            <div className="h-56 rounded-2xl bg-slate-100" />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="h-56 rounded-2xl bg-slate-100" />
              <div className="h-56 rounded-2xl bg-slate-100" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const fullName = personName(user);
  const changes = form ? changesBetween(user, form) : {};
  const hasChanges = Object.keys(changes).length > 0;

  function startEditing() {
    setForm(formFrom(user!));
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

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError("First name and last name are required.");
      return;
    }
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    setFormError("");
    mutate(changes);
  }

  // While a verify panel is open the page content folds away, as on the
  // onboarding card.
  const panelOpen = openPanel !== null;

  return (
    <div className="pb-10">
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          panelOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
        }`}
      >
        <div className="py-4">
          <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your details and the schools you belong to.
          </p>
        </div>

        {/* Header card: banner, photo and name. The photo overlaps the banner. */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="h-20 sm:h-24 bg-linear-to-r from-violet-500 to-indigo-500" />
          <div className="px-5 pb-5">
            <div className="-mt-12 sm:-mt-14">
              <ProfilePhoto
                firstName={user.first_name}
                lastName={user.last_name}
              />
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-800 wrap-break-word">
              {fullName}
            </h2>
            <p className="text-xs text-slate-400">
              {[
                user.public_id,
                `Member since ${formatProfileDate(user.date_joined)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </section>

        {/* Editable: personal details and addresses share one form. */}
        <form onSubmit={handleSave} className="mt-4 grid gap-4 lg:grid-cols-2">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="First name"
                  required
                  value={form.first_name}
                  maxLength={MAX_LENGTH.first_name}
                  onChange={(value) => setField("first_name", value)}
                />
                <TextField
                  label="Middle name"
                  value={form.middle_name}
                  maxLength={MAX_LENGTH.middle_name}
                  onChange={(value) => setField("middle_name", value)}
                />
                <TextField
                  label="Last name"
                  required
                  value={form.last_name}
                  maxLength={MAX_LENGTH.last_name}
                  onChange={(value) => setField("last_name", value)}
                />
                <SelectField
                  label="Gender"
                  value={form.gender}
                  options={GENDER_OPTIONS}
                  onChange={(value) => setField("gender", value)}
                />
              </div>
            ) : (
              <dl className="divide-y divide-slate-50">
                <DetailRow label="First name">{user.first_name}</DetailRow>
                <DetailRow label="Middle name">{user.middle_name}</DetailRow>
                <DetailRow label="Last name">{user.last_name}</DetailRow>
                <DetailRow label="Gender">{genderLabel(user.gender)}</DetailRow>
              </dl>
            )}
          </ProfileSection>

          <ProfileSection title="Addresses">
            {isEditing && form ? (
              <div className="flex flex-col gap-4">
                <AddressFields
                  title="Residential"
                  fields={RESIDENTIAL_FIELDS}
                  values={form}
                  onChange={setField}
                />
                <AddressFields
                  title="Office"
                  fields={OFFICE_FIELDS}
                  values={form}
                  onChange={setField}
                />
              </div>
            ) : (
              <dl className="divide-y divide-slate-50">
                <DetailRow label="Residential">
                  {joinAddress([
                    user.r_address,
                    user.r_city,
                    user.r_district,
                    user.r_state,
                    user.r_country,
                  ])}
                </DetailRow>
                <DetailRow label="Office">
                  {joinAddress([
                    user.o_address,
                    user.o_city,
                    user.o_district,
                    user.o_state,
                    user.o_country,
                  ])}
                </DetailRow>
              </dl>
            )}
          </ProfileSection>

          {isEditing && (
            <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p role="alert" className="min-h-4 text-xs text-red-600">
                {formError}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isPending}
                  className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!hasChanges || isPending}
                  className="cursor-pointer relative flex items-center justify-center px-5 py-2 text-xs text-white rounded-xl bg-violet-600 hover:bg-violet-700 shadow-sm shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className={isPending ? "invisible" : ""}>
                    Save changes
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${
                      isPending ? "" : "invisible"
                    }`}
                  >
                    <ButtonLoader />
                  </span>
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Read-only: contact and account. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ProfileSection
            title="Contact"
            description="Changing these goes through verification."
          >
            <dl className="divide-y divide-slate-50">
              <DetailRow label="Email">
                <span className="flex flex-wrap items-center gap-2">
                  {user.email}
                  <VerifiedBadge verified={user.email_is_valid} />
                  {!user.email_is_valid && (
                    <VerifyButton onClick={() => setOpenPanel("email")} />
                  )}
                </span>
              </DetailRow>
              <DetailRow label="Phone">
                <span className="flex flex-wrap items-center gap-2">
                  {user.phone}
                  <VerifiedBadge verified={user.phone_is_valid} />
                  {!user.phone_is_valid && (
                    <VerifyButton onClick={() => setOpenPanel("phone")} />
                  )}
                </span>
              </DetailRow>
            </dl>
          </ProfileSection>

          <ProfileSection title="Account">
            <dl className="divide-y divide-slate-50">
              <DetailRow label="Public ID">{user.public_id}</DetailRow>
              <DetailRow label="Joined as">
                <span className="capitalize">{user.joined_as}</span>
              </DetailRow>
              <DetailRow label="Default user type">
                <span className="capitalize">{user.default_user_type}</span>
              </DetailRow>
              <DetailRow label="Sign-up type">
                <span className="capitalize">{user.signup_type}</span>
              </DetailRow>
              <DetailRow label="Member since">
                {formatProfileDate(user.date_joined)}
              </DetailRow>
              <DetailRow label="Last sign-in">
                {formatProfileDate(user.last_login)}
              </DetailRow>
            </dl>
          </ProfileSection>
        </div>

        {/* My schools */}
        <div className="mt-4">
          <ProfileSection
            title="My schools"
            description="Schools where you are on the staff."
          >
            {user.portfolios.length === 0 ? (
              <p className="text-xs text-slate-400">
                You are not on any school&apos;s staff yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {user.portfolios.map((portfolio) => (
                  <SchoolCard key={portfolio.id} portfolio={portfolio} />
                ))}
              </ul>
            )}
          </ProfileSection>
        </div>
      </div>

      {/* Verify panels — each folds to zero width unless it is the open one. */}
      <VerifyEmailPanel
        show={openPanel === "email"}
        onClose={() => setOpenPanel(null)}
        email={user.email}
        userId={userId}
      />
      <VerifyPhonePanel
        show={openPanel === "phone"}
        onClose={() => setOpenPanel(null)}
        phone={user.phone}
        userId={userId}
      />
    </div>
  );
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function VerifyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-violet-200 px-2 py-0.5 text-[10px] font-medium text-violet-700 transition-colors hover:bg-violet-50"
    >
      Verify
    </button>
  );
}

// One school the person is on the staff of. This school's card links to the
// staff profile; the others are information only, because the app serves one
// school.
function SchoolCard({ portfolio }: { portfolio: UserPortfolioSummary }) {
  const isThisSchool = portfolio.school.id === SCHOOL_ID;
  const facts = [
    employmentLabel(portfolio.employment),
    portfolio.academic ? "Academic" : "Non-academic",
    `Added ${formatProfileDate(portfolio.created_on)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 wrap-break-word">
            {portfolio.school.name}
          </p>
          <StaffStatusBadge status={portfolio.status} />
          {portfolio.is_super_admin && (
            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold">
              Super Admin
            </span>
          )}
          {portfolio.active_login && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
              Default login school
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">{facts}</p>
        {portfolio.roles.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Roles">
            {portfolio.roles.map((role) => (
              <li
                key={role.id}
                className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
              >
                {role.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0">
        {isThisSchool ? (
          <Link
            href={`/dashboard/staff-profile?id=${portfolio.id}`}
            className="cursor-pointer inline-block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700"
          >
            View profile
          </Link>
        ) : (
          <span className="text-[11px] text-slate-400">
            Other school — information only
          </span>
        )}
      </div>
    </li>
  );
}
