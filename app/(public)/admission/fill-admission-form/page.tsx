"use client";

/**
 * app/admission/fill-admission-form/page.tsx
 *
 * Multi-step online admission form for Lutheran High School.
 *
 * Step 1 – Pay Admission Processing Fee (₦3,000)
 *   Shows bank details, payment methods, proof requirements.
 *   "I MADE PAYMENT" button → confirmation modal → Step 2.
 *
 * Step 2 – Provide Payment Details For Validation
 *   Collects depositor info + proof-of-payment image.
 *   "VERIFY MY PAYMENT" → confirmation modal → generates token → emails → Step 3.
 *
 * Step 3 – Fill Admission Form
 *   Full admission form pre-filled with the Form ID token from Step 2.
 *   On submit → emails form payload to school + applicant.
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Step 2 form data shape */
interface PaymentFormData {
  depositorSurname: string;
  depositorFirstname: string;
  depositorOthers: string;
  email: string;
  phone: string;
  modeOfPayment: string;
  paymentDatetime: string;
  bankPaidTo: string;
  transactionReference: string;
  proofFile: File | null;
}

/** Step 3 admission form data shape */
interface AdmissionFormData {
  formId: string;
  // Form reference
  formEmail: string; // email the form confirmation will be sent to
  /**
   * Audit trail: how the applicant reached the admission form.
   * "generated" = came through the normal Step 1 → 2 → 3 flow (Form ID was just created).
   * "pre-issued" = applicant arrived via the shortcut link using an existing Form ID.
   */
  formIdStatus: "generated" | "pre-issued";
  // Student personal details
  surname: string;
  firstname: string;
  otherNames: string;
  gender: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  nationality: string;
  religion: string;
  bloodGroup: string;
  // Contact
  homeAddress: string;
  // Class applying for
  classApplyingFor: string;
  entryType: string; // Day / Boarding
  // Previous school
  previousSchoolName: string;
  previousSchoolAddress: string;
  lastClassAttended: string;
  reasonForLeaving: string;
  // Parent / Guardian 1
  parent1Surname: string;
  parent1Firstname: string;
  parent1Relationship: string;
  parent1Phone: string;
  parent1Email: string;
  parent1Occupation: string;
  parent1Employer: string;
  parent1Address: string;
  // Parent / Guardian 2 (optional)
  parent2Surname: string;
  parent2Firstname: string;
  parent2Relationship: string;
  parent2Phone: string;
  parent2Email: string;
  // Emergency contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  // Health
  medicalConditions: string;
  allergies: string;
  // Declaration
  declarationAccepted: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BANK_ACCOUNTS = [
  {
    bank: "GTBank",
    account: "0107355105",
    name: "Lutheran High School, Obot Idim",
    colorClass: "bg-orange-50 border-orange-200",
    labelClass: "text-orange-600",
  },
  {
    bank: "Zenith Bank",
    account: "1011112061",
    name: "Lutheran High School, Obot Idim",
    colorClass: "bg-blue-50 border-blue-200",
    labelClass: "text-blue-600",
  },
];

const PAYMENT_MODES = [
  {
    value: "ussd",
    label: "USSD Transfer",
    proof: "A clear image of your debit alert.",
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer (App / Internet Banking)",
    proof: "An image of your debit alert OR bank receipt.",
  },
  {
    value: "bank_deposit",
    label: "Bank Deposit",
    proof: "A clear image of your deposit slip.",
  },
  {
    value: "pos",
    label: "POS Transfer",
    proof: "A clear image of your POS transfer slip.",
  },
  {
    value: "other",
    label: "Other Mode",
    proof: "Any clear image of an applicable proof of payment.",
  },
];

const CLASSES = ["JS1", "JSS2", "SS1", "SS2"];
const RELIGIONS = ["Christianity", "Islam", "Others"];
const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];

// ── Utility: generate unique Form ID from phone + name initials + timestamp ───
function generateFormId(
  phone: string,
  surname: string,
  firstname: string,
): string {
  const now = new Date();
  // e.g. 20250524-1430
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  // Last 6 digits of phone
  const phonePart = phone.replace(/\D/g, "").slice(-6);
  // Initials: first letter of surname + first letter of firstname (uppercase)
  const initials = `${surname.charAt(0)}${firstname.charAt(0)}`.toUpperCase();

  return `LHS-${initials}-${phonePart}-${datePart}${timePart}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Progress stepper displayed at the top of the page */
function StepIndicator({
  current,
  step2Skipped,
}: {
  current: 1 | 2 | 3;
  /** True when the user jumped directly from Step 1 to Step 3 via Form ID recovery */
  step2Skipped?: boolean;
}) {
  const steps = [
    { num: 1, label: "Pay Fee" },
    { num: 2, label: "Verify Payment" },
    { num: 3, label: "Admission Form" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        // Step 2 gets a special "skipped" appearance when bypassed
        const skipped = step2Skipped && s.num === 2;

        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
                  skipped
                    ? "bg-amber-100 border-amber-400 text-amber-600"
                    : done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                        ? "bg-indigo-700 border-indigo-400 text-white shadow-lg shadow-indigo-900/40"
                        : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {skipped ? (
                  /* Dashed circle slash icon for skipped */
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                ) : done ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                  skipped
                    ? "text-amber-500"
                    : active
                      ? "text-indigo-700"
                      : done
                        ? "text-emerald-600"
                        : "text-slate-400"
                }`}
              >
                {skipped ? "Skipped" : s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors duration-300 ${
                  // Connector after step 1 turns amber when step 2 was skipped
                  step2Skipped && s.num === 1
                    ? "bg-amber-300"
                    : current > s.num
                      ? "bg-emerald-400"
                      : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Reusable confirmation modal */
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-[fadeInUp_0.2s_ease-out]">
        <h3
          className="text-xl font-bold text-indigo-950 mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-7">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-full border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-5 py-3 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Shared form field label */
function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
    >
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );
}

/** Shared text input */
function TextInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-500"
    />
  );
}

/** Shared select */
function SelectInput({
  id,
  value,
  onChange,
  required,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all appearance-none cursor-pointer"
    >
      {children}
    </select>
  );
}

/** Shared textarea */
function TextareaInput({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Pay Admission Processing Fee
// ══════════════════════════════════════════════════════════════════════════════

function Step1({
  onProceed,
  onSkipToForm,
}: {
  onProceed: () => void;
  /** Called when the user already has a Form ID and wants to jump straight to Step 3 */
  onSkipToForm: (formId: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  // ── "Already have a Form ID?" recovery panel state ──
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryId, setRecoveryId] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  return (
    <div>
      {/* Warning banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <span className="text-2xl shrink-0">⚠️</span>
        <div>
          <p className="font-bold text-rose-800 text-sm mb-1">
            Important: Please Read Before Continuing
          </p>
          <p className="text-rose-700 text-sm leading-relaxed">
            Do <strong>not terminate or close this process once started</strong>{" "}
            to avoid any technical issues. Complete all steps in one sitting if
            possible.
          </p>
        </div>
      </div>

      {/* Main instruction */}
      <div className="bg-white border border-slate-200 rounded-3xl p-7 mb-6 shadow-sm">
        <h3
          className="font-bold text-indigo-950 text-xl mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Pay Admission Processing / Form Fee
        </h3>
        <div className="flex items-center gap-3 mb-5">
          <div className="px-5 py-2 rounded-full bg-indigo-700 text-white font-bold text-2xl shadow-md">
            ₦3,000
          </div>
          <span className="text-slate-500 text-sm">
            Non-refundable form fee
          </span>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          Please pay the admission processing/form fee of{" "}
          <strong>₦3,000</strong> to any of our official school accounts below
          using any of our approved modes of payment. Retrieve the required
          proof of payment as highlighted below. Click{" "}
          <strong className="text-indigo-700">"I MADE PAYMENT"</strong> when you
          have completed this step to continue to Step 2.
        </p>
      </div>

      {/* Bank accounts */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Official School Bank Accounts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BANK_ACCOUNTS.map(
            ({ bank, account, name, colorClass, labelClass }) => (
              <div
                key={bank}
                className={`border rounded-2xl p-5 ${colorClass}`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${labelClass} mb-2`}
                >
                  {bank}
                </p>
                <p className="font-mono font-bold text-slate-800 text-xl mb-0.5">
                  {account}
                </p>
                <p className="text-slate-500 text-xs">{name}</p>
              </div>
            ),
          )}
        </div>
      </div>

      {/* Approved payment modes */}
      <div className="bg-white border border-slate-200 rounded-3xl p-7 mb-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Approved Modes of Payment & Required Proof
        </p>
        <div className="space-y-3">
          {PAYMENT_MODES.map(({ value, label, proof }) => (
            <div
              key={value}
              className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
              <div>
                <p className="text-slate-800 font-semibold text-sm">{label}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Required proof: {proof}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowModal(true)}
          className="px-10 py-4 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg shadow-indigo-900/30 hover:scale-105 hover:shadow-indigo-700/50 transition-all duration-200 cursor-pointer"
        >
          ✅ I MADE PAYMENT: Proceed to Step 2
        </button>
      </div>

      {/* ── Recovery panel: skip to form with existing Form ID ── */}
      <div className="mt-8">
        {!showRecovery ? (
          /* Collapsed trigger link */
          <div className="text-center">
            <button
              onClick={() => setShowRecovery(true)}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors underline underline-offset-2 cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Already have a Form ID? Click here to go directly to the admission
              form
            </button>
          </div>
        ) : (
          /* Expanded recovery panel */
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">🔑</span>
                <div>
                  <p className="font-bold text-amber-900 text-sm mb-1">
                    Already Have a Form ID?
                  </p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    If you previously completed Step 2 but experienced a network
                    issue or service interruption that prevented you from
                    reaching the form, enter your Form ID below to proceed
                    directly to Step 3. Your Form ID was sent to your email
                    after Step 2: it looks like{" "}
                    <code className="bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-mono text-amber-900 text-xs">
                      LHS-EU-012345-202505241430
                    </code>
                    .
                  </p>
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryId("");
                  setRecoveryError("");
                }}
                className="text-amber-400 hover:text-amber-700 transition-colors shrink-0 mt-0.5 cursor-pointer"
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Input row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={recoveryId}
                  onChange={(e) => {
                    setRecoveryId(e.target.value.trim().toUpperCase());
                    setRecoveryError("");
                  }}
                  placeholder="e.g. LHS-EU-012345-202505241430"
                  className={`w-full px-4 py-3 rounded-xl border font-mono text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-white ${
                    recoveryError
                      ? "border-rose-400 bg-rose-50"
                      : "border-amber-300"
                  }`}
                />
                {recoveryError && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {recoveryError}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  // Validate: must start with LHS- and have reasonable length
                  if (!recoveryId) {
                    setRecoveryError("Please enter your Form ID.");
                    return;
                  }
                  if (
                    !recoveryId.startsWith("LHS-") ||
                    recoveryId.length < 18
                  ) {
                    setRecoveryError(
                      "That doesn't look like a valid LHS Form ID. Please check your email and try again.",
                    );
                    return;
                  }
                  // All good — jump to Step 3
                  onSkipToForm(recoveryId);
                }}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap cursor-pointer"
              >
                Go to Admission Form →
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-amber-600 text-xs mt-3 leading-relaxed">
              <strong>Note:</strong> Skipping directly to the form means your
              payment has already been verified by the school via Step 2. If you
              have not yet paid or verified your payment, please use the{" "}
              <strong>"I MADE PAYMENT"</strong> button above instead.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <ConfirmModal
          title="Confirm Payment Made"
          message="By proceeding, you confirm that you have successfully made the ₦3,000 admission form fee payment to our official school account and have your proof of payment ready. Are you sure you want to continue?"
          confirmLabel="Continue"
          onConfirm={() => {
            setShowModal(false);
            onProceed();
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Provide Payment Details For Validation
// ══════════════════════════════════════════════════════════════════════════════

function Step2({
  onProceed,
}: {
  onProceed: (formId: string, email: string) => void;
}) {
  // Form state
  const [data, setData] = useState<PaymentFormData>({
    depositorSurname: "",
    depositorFirstname: "",
    depositorOthers: "",
    email: "",
    phone: "",
    modeOfPayment: "",
    paymentDatetime: "",
    bankPaidTo: "",
    transactionReference: "",
    proofFile: null,
  });

  const [proofFileName, setProofFileName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handy setter for string fields
  const set = useCallback(
    (field: keyof PaymentFormData) => (value: string) =>
      setData((prev) => ({ ...prev, [field]: value })),
    [],
  );

  // File input handler
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setData((prev) => ({ ...prev, proofFile: file }));
    setProofFileName(file?.name ?? "");
  }

  // Validate required fields before showing modal
  function handleSubmit() {
    if (
      !data.depositorSurname ||
      !data.depositorFirstname ||
      !data.email ||
      !data.phone ||
      !data.modeOfPayment ||
      !data.paymentDatetime ||
      !data.bankPaidTo ||
      !data.proofFile
    ) {
      toast.error(
        "Please fill in all required fields and upload proof of payment.",
      );
      return;
    }
    setShowModal(true);
  }

  // On modal confirm: generate token, send email, proceed
  async function handleConfirm() {
    setLoading(true);
    const formId = generateFormId(
      data.phone,
      data.depositorSurname,
      data.depositorFirstname,
    );

    try {
      // Build FormData so we can include the file
      const fd = new FormData();
      fd.append("formId", formId);
      fd.append(
        "depositorName",
        `${data.depositorSurname} ${data.depositorFirstname} ${data.depositorOthers}`.trim(),
      );
      fd.append("email", data.email);
      fd.append("phone", data.phone);
      fd.append("modeOfPayment", data.modeOfPayment);
      fd.append("paymentDatetime", data.paymentDatetime);
      fd.append("bankPaidTo", data.bankPaidTo);
      fd.append("transactionReference", data.transactionReference);
      if (data.proofFile) fd.append("proofFile", data.proofFile);

      const res = await fetch("/api/send-payment-verification", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Email sending failed");

      toast.success("Payment details sent! Check your email for your Form ID.");
      setShowModal(false);
      onProceed(formId, data.email);
    } catch {
      toast.error("There was an error sending your details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Get the proof hint for the selected payment mode
  const selectedMode = PAYMENT_MODES.find(
    (m) => m.value === data.modeOfPayment,
  );

  return (
    <div>
      {/* Instructions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-7 mb-8 shadow-sm">
        <h3
          className="font-bold text-indigo-950 text-xl mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Provide Payment Details For Validation
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Please provide all required proof of payment in the form below for
          validation. Your admission form will be automatically generated after
          this step is successfully completed. Click{" "}
          <strong className="text-indigo-700">"VERIFY MY PAYMENT"</strong> when
          you have completed this step to continue to Step 3.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm space-y-6">
        {/* Depositor's Full Name */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Depositor&apos;s Full Name <span className="text-rose-500">*</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <FieldLabel htmlFor="dep-surname" required>
                Surname
              </FieldLabel>
              <TextInput
                id="dep-surname"
                value={data.depositorSurname}
                onChange={set("depositorSurname")}
                placeholder="Udo"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="dep-firstname" required>
                First Name
              </FieldLabel>
              <TextInput
                id="dep-firstname"
                value={data.depositorFirstname}
                onChange={set("depositorFirstname")}
                placeholder="Ekong"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="dep-others">Other Names</FieldLabel>
              <TextInput
                id="dep-others"
                value={data.depositorOthers}
                onChange={set("depositorOthers")}
                placeholder="(optional)"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <FieldLabel htmlFor="dep-email" required>
            Email Address
          </FieldLabel>
          <p className="text-xs text-slate-400 mb-1.5">
            Your Form ID and confirmation will be sent here.
          </p>
          <TextInput
            id="dep-email"
            type="email"
            value={data.email}
            onChange={set("email")}
            placeholder="example@mail.com"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <FieldLabel htmlFor="dep-phone" required>
            Phone Number
          </FieldLabel>
          <TextInput
            id="dep-phone"
            type="tel"
            value={data.phone}
            onChange={set("phone")}
            placeholder="+2347012345678"
            required
          />
        </div>

        {/* Mode of Payment */}
        <div>
          <FieldLabel htmlFor="dep-mode" required>
            Mode of Payment
          </FieldLabel>
          <SelectInput
            id="dep-mode"
            value={data.modeOfPayment}
            onChange={set("modeOfPayment")}
            required
          >
            <option value="">-- Choose an option --</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </SelectInput>
          {/* Show proof hint */}
          {selectedMode && (
            <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Required proof: {selectedMode.proof}
            </p>
          )}
        </div>

        {/* Bank Paid To */}
        <div>
          <FieldLabel htmlFor="dep-bank" required>
            Bank Paid To
          </FieldLabel>
          <SelectInput
            id="dep-bank"
            value={data.bankPaidTo}
            onChange={set("bankPaidTo")}
            required
          >
            <option value="">-- Select bank --</option>
            {BANK_ACCOUNTS.map((b) => (
              <option key={b.bank} value={b.bank}>
                {b.bank} ({b.account})
              </option>
            ))}
          </SelectInput>
        </div>

        {/* Date & Time of Payment */}
        <div>
          <FieldLabel htmlFor="dep-datetime" required>
            Date and Time of Payment
          </FieldLabel>
          <TextInput
            id="dep-datetime"
            type="datetime-local"
            value={data.paymentDatetime}
            onChange={set("paymentDatetime")}
            required
          />
        </div>

        {/* Transaction Reference (optional) */}
        <div>
          <FieldLabel htmlFor="dep-ref">
            Transaction Reference / Receipt Number
          </FieldLabel>
          <TextInput
            id="dep-ref"
            value={data.transactionReference}
            onChange={set("transactionReference")}
            placeholder="e.g. TRF20250524123456 (if available)"
          />
        </div>

        {/* Proof of Payment Upload */}
        <div>
          <FieldLabel htmlFor="dep-proof" required>
            Proof of Payment
          </FieldLabel>
          <p className="text-xs text-slate-400 mb-2">
            Upload a clear image of your{" "}
            {selectedMode?.proof ?? "payment proof"}. Accepted formats: JPG,
            PNG, PDF. Max 5MB.
          </p>
          <label
            htmlFor="dep-proof"
            className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 cursor-pointer hover:border-indigo-400 hover:bg-indigo-100 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-indigo-500 shrink-0"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p className="text-indigo-700 font-semibold text-sm">
                {proofFileName || "Click to upload proof of payment"}
              </p>
              {!proofFileName && (
                <p className="text-indigo-400 text-xs mt-0.5">
                  JPG, PNG or PDF — max 5 MB
                </p>
              )}
            </div>
          </label>
          <input
            id="dep-proof"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          className="px-10 py-4 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg shadow-indigo-900/30 hover:scale-105 hover:shadow-indigo-700/50 transition-all duration-200 cursor-pointer"
        >
          🔍 VERIFY MY PAYMENT: Proceed to Step 3
        </button>
      </div>

      {/* Confirmation modal */}
      {showModal && (
        <ConfirmModal
          title="Confirm Payment Verification"
          message={`You are about to submit your payment details for validation. Your unique Form ID will be generated and sent to ${data.email || "the school"} for processing. Continue?`}
          confirmLabel="Yes, Submit Details"
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Admission Form
// ══════════════════════════════════════════════════════════════════════════════

function Step3({
  formId,
  applicantEmail,
  step2Skipped = false,
}: {
  formId: string;
  applicantEmail: string;
  /** True when the user jumped directly from Step 1 via Form ID recovery */
  step2Skipped?: boolean;
}) {
  // All form fields — keyed object for easy state management
  const [data, setData] = useState<AdmissionFormData>({
    formId,
    formEmail: applicantEmail, // pre-filled from Step 2; empty if shortcut path
    formIdStatus: step2Skipped ? "pre-issued" : "generated",
    surname: "",
    firstname: "",
    otherNames: "",
    gender: "",
    dateOfBirth: "",
    stateOfOrigin: "",
    lgaOfOrigin: "",
    nationality: "Nigerian",
    religion: "",
    bloodGroup: "",
    homeAddress: "",
    classApplyingFor: "",
    entryType: "",
    previousSchoolName: "",
    previousSchoolAddress: "",
    lastClassAttended: "",
    reasonForLeaving: "",
    parent1Surname: "",
    parent1Firstname: "",
    parent1Relationship: "",
    parent1Phone: "",
    parent1Email: "",
    parent1Occupation: "",
    parent1Employer: "",
    parent1Address: "",
    parent2Surname: "",
    parent2Firstname: "",
    parent2Relationship: "",
    parent2Phone: "",
    parent2Email: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    medicalConditions: "",
    allergies: "",
    declarationAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Handy setter
  const set = useCallback(
    (field: keyof AdmissionFormData) => (value: string | boolean) =>
      setData((prev) => ({ ...prev, [field]: value })),
    [],
  );

  async function handleSubmit() {
    if (!data.declarationAccepted) {
      toast.error("Please accept the declaration before submitting.");
      return;
    }
    if (
      !data.surname ||
      !data.firstname ||
      !data.gender ||
      !data.dateOfBirth ||
      !data.classApplyingFor ||
      !data.entryType ||
      !data.parent1Surname ||
      !data.parent1Firstname ||
      !data.parent1Phone
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    // The form reference email is always required — it's where the confirmation goes
    if (!data.formEmail) {
      toast.error(
        "Please provide the email address in the Form Reference section.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-admission-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, applicantEmail: data.formEmail }),
      });

      if (!res.ok) throw new Error("Submission failed");

      setSubmitted(true);
      toast.success(
        "Admission form submitted successfully! Check your email for confirmation.",
      );
    } catch {
      toast.error("There was an error submitting your form. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="text-center py-14">
        <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center text-4xl mx-auto mb-6">
          🎉
        </div>
        <h2
          className="text-3xl font-bold text-indigo-950 mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Application Submitted!
        </h2>
        <p className="text-slate-600 text-base leading-relaxed max-w-md mx-auto mb-5">
          Your admission form has been successfully submitted. A copy has been
          sent to your email. Our team will review your application and contact
          you within <strong>1 to 48 working hours</strong> with your entrance
          examination schedule.
        </p>
        <div className="inline-block bg-indigo-50 border border-indigo-200 rounded-2xl px-6 py-3 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            Your Form ID
          </p>
          <p className="font-mono font-bold text-indigo-800 text-lg">
            {formId}
          </p>
        </div>
        <br />
        <Link
          href="/admission"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-md hover:scale-105 transition-all duration-200"
        >
          Back to Admissions
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Instructions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-7 mb-8 shadow-sm">
        <h3
          className="font-bold text-indigo-950 text-xl mb-3"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Fill Admission Form
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Please fill in all required fields accurately. Upon submission, a copy
          will be sent to the email address in the Form Reference section below.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Section: Form Reference ── */}
        <FormSection title="Form Reference" icon="🆔">
          {/* Pre-issued indicator badge */}
          <div>
            <FieldLabel htmlFor="preissued">Form ID Status</FieldLabel>
            <div className="flex items-center gap-3 mt-1">
              {step2Skipped ? (
                /* Shortcut path — form ID was typed in manually */
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-amber-800 text-sm font-semibold">
                    Pre-issued:
                  </span>
                  <span className="text-amber-600 text-xs">
                    Form ID was issued before this session
                  </span>
                </div>
              ) : (
                /* Normal flow — form ID was just generated by Step 2 */
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-emerald-800 text-sm font-semibold">
                    Auto Generated:
                  </span>
                  <span className="text-emerald-600 text-xs">
                    Form ID was just created in Step 2
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form ID — read-only always */}
          <div>
            <FieldLabel htmlFor="formId">
              Form ID{" "}
              {step2Skipped
                ? "(pre-issued, entered by you)"
                : "(auto-generated from Step 2)"}
            </FieldLabel>
            <TextInput
              id="formId"
              value={data.formId}
              onChange={() => {}}
              disabled
            />
            {step2Skipped && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Ensure this matches exactly what was sent to your email after
                Step 2.
              </p>
            )}
          </div>

          {/* Applicant email — the single address the filled form is sent to */}
          <div>
            <FieldLabel htmlFor="ref-email" required>
              Applicant&apos;s Email Address
            </FieldLabel>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              {step2Skipped
                ? "Enter the same email address that received your Form ID. This is where your completed admission form will be sent."
                : "This is the email that received your Form ID in Step 2. Your completed admission form will be sent here. Do not change it unless you are correcting a mistake."}
            </p>
            <TextInput
              id="ref-email"
              type="email"
              value={data.formEmail}
              onChange={set("formEmail")}
              placeholder="example@mail.com"
              required
              /* Pre-filled and locked when coming from Step 2 */
              disabled={!step2Skipped}
            />
            {!step2Skipped && (
              <p className="text-xs text-indigo-500 mt-1.5 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Pre-filled from Step 2 and locked. Contact the school if this
                email is incorrect.
              </p>
            )}
          </div>
        </FormSection>

        {/* ── Section: Student's Personal Information ── */}
        <FormSection title="Student's Personal Information" icon="👤">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="a-surname" required>
                Surname
              </FieldLabel>
              <TextInput
                id="a-surname"
                value={data.surname}
                onChange={set("surname")}
                placeholder="Udo"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="a-firstname" required>
                First Name
              </FieldLabel>
              <TextInput
                id="a-firstname"
                value={data.firstname}
                onChange={set("firstname")}
                placeholder="Ekong"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="a-others">Other Names</FieldLabel>
              <TextInput
                id="a-others"
                value={data.otherNames}
                onChange={set("otherNames")}
                placeholder="(optional)"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="a-gender" required>
                Gender
              </FieldLabel>
              <SelectInput
                id="a-gender"
                value={data.gender}
                onChange={set("gender")}
                required
              >
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="a-dob" required>
                Date of Birth
              </FieldLabel>
              <TextInput
                id="a-dob"
                type="date"
                value={data.dateOfBirth}
                onChange={set("dateOfBirth")}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="a-state" required>
                State of Origin
              </FieldLabel>
              <TextInput
                id="a-state"
                value={data.stateOfOrigin}
                onChange={set("stateOfOrigin")}
                placeholder="e.g. Akwa Ibom"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="a-lga" required>
                LGA of Origin
              </FieldLabel>
              <TextInput
                id="a-lga"
                value={data.lgaOfOrigin}
                onChange={set("lgaOfOrigin")}
                placeholder="e.g. Ibesikpo Asutan"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="a-nationality">Nationality</FieldLabel>
              <TextInput
                id="a-nationality"
                value={data.nationality}
                onChange={set("nationality")}
              />
            </div>
            <div>
              <FieldLabel htmlFor="a-religion">Religion</FieldLabel>
              <SelectInput
                id="a-religion"
                value={data.religion}
                onChange={set("religion")}
              >
                <option value="">-- Select --</option>
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="a-blood">Blood Group</FieldLabel>
              <SelectInput
                id="a-blood"
                value={data.bloodGroup}
                onChange={set("bloodGroup")}
              >
                <option value="">-- Select --</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </SelectInput>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="a-address" required>
              Home Address
            </FieldLabel>
            <TextareaInput
              id="a-address"
              value={data.homeAddress}
              onChange={set("homeAddress")}
              placeholder="Full residential address"
              rows={2}
            />
          </div>
        </FormSection>

        {/* ── Section: Class & Entry Type ── */}
        <FormSection title="Class & Entry Type" icon="🎓">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="a-class" required>
                Class Applying For
              </FieldLabel>
              <SelectInput
                id="a-class"
                value={data.classApplyingFor}
                onChange={set("classApplyingFor")}
                required
              >
                <option value="">-- Select class --</option>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="a-entry" required>
                Entry Type
              </FieldLabel>
              <SelectInput
                id="a-entry"
                value={data.entryType}
                onChange={set("entryType")}
                required
              >
                <option value="">-- Select --</option>
                <option value="Day">Day Student</option>
                <option value="Boarding">Boarding Student</option>
              </SelectInput>
            </div>
          </div>
        </FormSection>

        {/* ── Section: Previous School ── */}
        <FormSection title="Previous School Information" icon="🏫">
          <div>
            <FieldLabel htmlFor="ps-name">Previous School Name</FieldLabel>
            <TextInput
              id="ps-name"
              value={data.previousSchoolName}
              onChange={set("previousSchoolName")}
              placeholder="Name of last school attended"
            />
          </div>
          <div>
            <FieldLabel htmlFor="ps-address">
              Previous School Address
            </FieldLabel>
            <TextareaInput
              id="ps-address"
              value={data.previousSchoolAddress}
              onChange={set("previousSchoolAddress")}
              placeholder="Address of previous school"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="ps-class">Last Class Attended</FieldLabel>
              <TextInput
                id="ps-class"
                value={data.lastClassAttended}
                onChange={set("lastClassAttended")}
                placeholder="e.g. Primary 6 / JSS2"
              />
            </div>
            <div>
              <FieldLabel htmlFor="ps-reason">Reason for Leaving</FieldLabel>
              <TextInput
                id="ps-reason"
                value={data.reasonForLeaving}
                onChange={set("reasonForLeaving")}
                placeholder="e.g. Graduated / Seeking better school"
              />
            </div>
          </div>
        </FormSection>

        {/* ── Section: Parent / Guardian 1 ── */}
        <FormSection title="Parent / Guardian 1 (Primary)" icon="👨‍👩‍👧">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="p1-surname" required>
                Surname
              </FieldLabel>
              <TextInput
                id="p1-surname"
                value={data.parent1Surname}
                onChange={set("parent1Surname")}
                placeholder="Udo"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="p1-firstname" required>
                First Name
              </FieldLabel>
              <TextInput
                id="p1-firstname"
                value={data.parent1Firstname}
                onChange={set("parent1Firstname")}
                placeholder="Ekong"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="p1-relation" required>
                Relationship to Applicant
              </FieldLabel>
              <SelectInput
                id="p1-relation"
                value={data.parent1Relationship}
                onChange={set("parent1Relationship")}
                required
              >
                <option value="">-- Select --</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="p1-phone" required>
                Phone Number
              </FieldLabel>
              <TextInput
                id="p1-phone"
                type="tel"
                value={data.parent1Phone}
                onChange={set("parent1Phone")}
                placeholder="+2347012345678"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="p1-email" required={step2Skipped}>
                Email Address
                {step2Skipped && (
                  <span className="ml-1.5 text-amber-500 font-normal normal-case tracking-normal text-xs">
                    — required for your confirmation
                  </span>
                )}
              </FieldLabel>
              <TextInput
                id="p1-email"
                type="email"
                value={data.parent1Email}
                onChange={set("parent1Email")}
                placeholder="parent@email.com"
                required={step2Skipped}
              />
            </div>
            <div>
              <FieldLabel htmlFor="p1-occ">Occupation</FieldLabel>
              <TextInput
                id="p1-occ"
                value={data.parent1Occupation}
                onChange={set("parent1Occupation")}
                placeholder="e.g. Teacher, Engineer"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="p1-employer">
              Employer / Business Name
            </FieldLabel>
            <TextInput
              id="p1-employer"
              value={data.parent1Employer}
              onChange={set("parent1Employer")}
              placeholder="(optional)"
            />
          </div>
          <div>
            <FieldLabel htmlFor="p1-address">Residential Address</FieldLabel>
            <TextareaInput
              id="p1-address"
              value={data.parent1Address}
              onChange={set("parent1Address")}
              placeholder="Full address"
              rows={2}
            />
          </div>
        </FormSection>

        {/* ── Section: Parent / Guardian 2 ── */}
        <FormSection title="Parent / Guardian 2 (Optional)" icon="👤">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="p2-surname">Surname</FieldLabel>
              <TextInput
                id="p2-surname"
                value={data.parent2Surname}
                onChange={set("parent2Surname")}
                placeholder="Udo"
              />
            </div>
            <div>
              <FieldLabel htmlFor="p2-firstname">First Name</FieldLabel>
              <TextInput
                id="p2-firstname"
                value={data.parent2Firstname}
                onChange={set("parent2Firstname")}
                placeholder="Ekong"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="p2-relation">Relationship</FieldLabel>
              <SelectInput
                id="p2-relation"
                value={data.parent2Relationship}
                onChange={set("parent2Relationship")}
              >
                <option value="">-- Select --</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </SelectInput>
            </div>
            <div>
              <FieldLabel htmlFor="p2-phone">Phone Number</FieldLabel>
              <TextInput
                id="p2-phone"
                type="tel"
                value={data.parent2Phone}
                onChange={set("parent2Phone")}
                placeholder="+2347012345678"
              />
            </div>
            <div>
              <FieldLabel htmlFor="p2-email">Email</FieldLabel>
              <TextInput
                id="p2-email"
                type="email"
                value={data.parent2Email}
                onChange={set("parent2Email")}
                placeholder="(optional)"
              />
            </div>
          </div>
        </FormSection>

        {/* ── Section: Emergency Contact ── */}
        <FormSection title="Emergency Contact" icon="🚨">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="ec-name" required>
                Full Name
              </FieldLabel>
              <TextInput
                id="ec-name"
                value={data.emergencyName}
                onChange={set("emergencyName")}
                placeholder="Emergency contact name"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="ec-phone" required>
                Phone Number
              </FieldLabel>
              <TextInput
                id="ec-phone"
                type="tel"
                value={data.emergencyPhone}
                onChange={set("emergencyPhone")}
                placeholder="+2347012345678"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="ec-relation">Relationship</FieldLabel>
              <TextInput
                id="ec-relation"
                value={data.emergencyRelationship}
                onChange={set("emergencyRelationship")}
                placeholder="e.g. Uncle, Aunt"
              />
            </div>
          </div>
        </FormSection>

        {/* ── Section: Health Information ── */}
        <FormSection title="Health Information" icon="🏥">
          <div>
            <FieldLabel htmlFor="h-conditions">
              Known Medical Conditions
            </FieldLabel>
            <TextareaInput
              id="h-conditions"
              value={data.medicalConditions}
              onChange={set("medicalConditions")}
              placeholder="List any known medical conditions (or write 'None')"
              rows={2}
            />
          </div>
          <div>
            <FieldLabel htmlFor="h-allergies">Known Allergies</FieldLabel>
            <TextareaInput
              id="h-allergies"
              value={data.allergies}
              onChange={set("allergies")}
              placeholder="List any known allergies (or write 'None')"
              rows={2}
            />
          </div>
        </FormSection>

        {/* ── Declaration ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-7">
          <h4
            className="font-bold text-amber-900 text-base mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Declaration
          </h4>
          <p className="text-amber-800 text-sm leading-relaxed mb-5">
            I hereby certify that the information provided in this form is true,
            accurate, and complete to the best of my knowledge. I understand
            that any false or misleading information may result in the
            cancellation of my admission. I agree to abide by all the rules and
            regulations of Lutheran High School, Obot Idim.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.declarationAccepted}
              onChange={(e) => set("declarationAccepted")(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-amber-800 font-semibold text-sm">
              I confirm that all information provided is accurate and I accept
              the terms above. <span className="text-rose-500">*</span>
            </span>
          </label>
        </div>

        {/* Submit button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-12 py-4 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg shadow-indigo-900/30 hover:scale-105 hover:shadow-indigo-700/50 transition-all duration-200 disabled:opacity-60 disabled:scale-100 flex items-center gap-3 cursor-pointer"
          >
            {loading && (
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {loading ? "Submitting Application..." : "🎓 SUBMIT ADMISSION FORM"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reusable form section wrapper */
function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100 bg-slate-50">
        <span className="text-xl">{icon}</span>
        <h4
          className="font-bold text-indigo-950 text-base"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h4>
      </div>
      {/* Section body */}
      <div className="p-7 space-y-4">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function FillAdmissionFormPage() {
  // Which step we're on
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Data passed from Step 2 → Step 3
  const [formId, setFormId] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  // True when the user bypassed Step 2 using an existing Form ID
  const [step2Skipped, setStep2Skipped] = useState(false);

  function handleStep1Done() {
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleStep2Done(id: string, email: string) {
    setFormId(id);
    setApplicantEmail(email);
    setStep2Skipped(false);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Called when a user enters a pre-existing Form ID and jumps straight to Step 3 */
  function handleSkipToForm(id: string) {
    setFormId(id);
    setApplicantEmail(""); // no email collected — Step 3 will ask for it
    setStep2Skipped(true);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {/* Toast container (must be rendered once at root level of page) */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <main className="min-h-screen bg-slate-50">
        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #1e1b4b 100%)",
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
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
                Online
              </span>
              <h1
                className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Online Admission Form
              </h1>
              <p className="text-teal-200 text-lg leading-relaxed">
                Complete your application in three simple steps: pay, verify,
                and fill your form securely from anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* ── Step content ── */}
        <div className="container mx-auto px-6 lg:px-16 py-14 max-w-3xl">
          <div className="mt-6 mb-8">
            <Link
              href="/admission"
              className="inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-500 transition-colors"
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
              Back to Admissions
            </Link>
          </div>
          {/* Step indicator */}
          <StepIndicator current={step} step2Skipped={step2Skipped} />

          {/* Step heading */}
          <div className="mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-2">
              Step {step} of 3
            </span>
            <h2
              className="text-3xl font-bold text-indigo-950"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {step === 1
                ? "Pay Admission Processing Fee"
                : step === 2
                  ? "Verify Payment Details"
                  : "Fill Your Admission Form"}
            </h2>
          </div>

          {/* Render active step */}
          {step === 1 && (
            <Step1
              onProceed={handleStep1Done}
              onSkipToForm={handleSkipToForm}
            />
          )}
          {step === 2 && <Step2 onProceed={handleStep2Done} />}
          {step === 3 && (
            <Step3
              formId={formId}
              applicantEmail={applicantEmail}
              step2Skipped={step2Skipped}
            />
          )}
        </div>
      </main>
    </>
  );
}
